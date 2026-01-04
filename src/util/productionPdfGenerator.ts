// utils/productionPdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LogoImg from '@/assets/Logo.png';

interface ProductionRecord {
  id_production: number;
  date_production: string;
  produit_nom: string;
  quantite_produite: number;
  unite: string;
  operateur: string;
  commentaire: string;
}

interface MatierePremiere {
  nom_matiere: string;
  quantite_totale: number;
  unite: string;
  stock_actuel: number;
}

const formatQuantite = (value: any): string => {
  try {
    const num = Number(value);
    if (!isFinite(num) || isNaN(num)) return "0";
    return Number.isInteger(num) ? num.toString() : num.toFixed(2);
  } catch {
    return "0";
  }
};

const formatMontant = (montant: number | string | null | undefined): string => {
  const num = typeof montant === 'string' ? parseFloat(montant) : montant;
  
  if (num === null || num === undefined || isNaN(num)) {
    return '0,00';
  }
  return num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  const date = new Date(dateStr);
  return date.toLocaleDateString('fr-FR');
};

/**
 * Ajoute l'en-tête avec logo sur une page
 */
const ajouterEnTete = async (doc: jsPDF, yPos: number, pageWidth: number): Promise<number> => {
  try {
    const img = new Image();
    img.src = LogoImg;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    const logoHeight = 30;
    const logoWidth = (img.width / img.height) * logoHeight;
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(img, 'PNG', logoX, yPos, logoWidth, logoHeight);
    yPos += logoHeight + 10;
  } catch (error) {
    console.error('Erreur lors du chargement du logo:', error);
    yPos += 25;
  }

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SARL SMS MONODORA', pageWidth / 2, yPos, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Fabrication de Divers produits de La Chimie Minerale', pageWidth / 2, yPos + 5, { align: 'center' });
  doc.text('Cite la Carriere Kherrata, Wilaya de Bejaia', pageWidth / 2, yPos + 10, { align: 'center' });

  return yPos + 20;
};

/**
 * Ajoute le pied de page
 */
const ajouterPiedDePage = (doc: jsPDF, pageWidth: number, pageHeight: number, margin: number) => {
  const footerY = pageHeight - 20;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text(
    'RC : 17B 0189221 06/00    N°Art: 0644 05024 76    NIF : 001706018922155    Tel /Fax 034 39 29 99',
    pageWidth / 2,
    footerY,
    { align: 'center' }
  );
  doc.text(
    'Site Web : www.klinkol.com    Email : contact@klinkol.com',
    pageWidth / 2,
    footerY + 4,
    { align: 'center' }
  );

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
};

/**
 * Génère un PDF de l'état des productions avec matières premières
 */
export const genererEtatProductionsPDF = async (
  productions: ProductionRecord[],
  matieresPremieresUtilisees: MatierePremiere[],
  periodLabel: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  // ============================================================
  // PAGE 1 : TABLEAU DES PRODUCTIONS
  // ============================================================
  
  let yPos = 20;
  yPos = await ajouterEnTete(doc, yPos, pageWidth);

  // Titre
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ÉTAT DES PRODUCTIONS', pageWidth / 2, yPos + 6, { align: 'center' });
  
  doc.setLineWidth(0.8);
  doc.line(margin, yPos + 10, pageWidth - margin, yPos + 10);

  yPos += 15;

  // Date d'édition et période
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(`Édité le : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`Période : ${periodLabel}`, pageWidth - margin, yPos, { align: 'right' });

  yPos += 10;

  // Tableau des productions
  if (!productions || productions.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Aucune production pour cette période', pageWidth / 2, yPos + 20, { align: 'center' });
  } else {
    // Calculer le total de quantité produite
    const totalQuantite = productions.reduce((acc, p) => acc + Number(p.quantite_produite), 0);
    const SACS_PAR_PALETTE = 64;
    const totalPalettes = totalQuantite / SACS_PAR_PALETTE;

    const tableData = productions.map((prod) => {
      const palettes = Number(prod.quantite_produite) / SACS_PAR_PALETTE;
      return [
        formatDate(prod.date_production),
        prod.produit_nom,
        formatQuantite(prod.quantite_produite) + ' ' + prod.unite,
        formatQuantite(palettes),
        prod.operateur || '-',
        prod.commentaire || '-'
      ];
    });

    // Ajouter la ligne des totaux
    tableData.push([
      '',
      'TOTAL',
      formatQuantite(totalQuantite) + ' ' + (productions[0]?.unite || 'sacs'),
      formatQuantite(totalPalettes),
      '',
      ''
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Produit', 'Quantité', 'Palettes', 'Opérateur', 'Commentaire']],
      body: tableData,
      theme: 'plain',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        font: 'helvetica',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 25 },
        1: { halign: 'left', cellWidth: 45 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 30 },
        5: { halign: 'left', cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data: any) => {
        // Styler la dernière ligne (totaux)
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 9;
          data.cell.styles.lineWidth = 0.8;
        }
      }
    });
  }

  // Pied de page
  ajouterPiedDePage(doc, pageWidth, pageHeight, margin);

  // ============================================================
  // PAGE 2 : MATIÈRES PREMIÈRES UTILISÉES
  // ============================================================
  
  doc.addPage();
  yPos = 20;
  yPos = await ajouterEnTete(doc, yPos, pageWidth);

  // Titre
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('MATIÈRES PREMIÈRES UTILISÉES', pageWidth / 2, yPos + 6, { align: 'center' });
  
  doc.setLineWidth(0.8);
  doc.line(margin, yPos + 10, pageWidth - margin, yPos + 10);

  yPos += 15;

  // Date d'édition et période
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(`Édité le : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`Période : ${periodLabel}`, pageWidth - margin, yPos, { align: 'right' });

  yPos += 10;

  // Tableau des matières premières
  if (!matieresPremieresUtilisees || matieresPremieresUtilisees.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Aucune matière première utilisée', pageWidth / 2, yPos + 20, { align: 'center' });
  } else {
    const matieresTableData = matieresPremieresUtilisees.map((matiere, index) => [
      (index + 1).toString(),
      matiere.nom_matiere,
      formatMontant(matiere.quantite_totale) + ' ' + matiere.unite,
      formatMontant(matiere.stock_actuel) + ' ' + matiere.unite
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['N°', 'Matière Première', 'Quantité Utilisée', 'Stock Actuel']],
      body: matieresTableData,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        font: 'helvetica',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', cellWidth: 80 },
        2: { halign: 'right', cellWidth: 45 },
        3: { halign: 'right', cellWidth: 40 },
      },
      margin: { left: margin, right: margin },
    });
  }

  // Pied de page
  ajouterPiedDePage(doc, pageWidth, pageHeight, margin);

  // Ouvrir le PDF
  window.open(doc.output('bloburl'), '_blank');
};

/**
 * Génère un PDF de l'état d'une production unique sur une seule page
 */
export const genererEtatProductionUniquePDF = async (
  productions: ProductionRecord[],
  matieresPremieresUtilisees: MatierePremiere[],
  periodLabel: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  // ============================================================
  // PAGE UNIQUE : PRODUCTION + MATIÈRES PREMIÈRES
  // ============================================================
  
  let yPos = 20;
  yPos = await ajouterEnTete(doc, yPos, pageWidth);

  // Titre
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ÉTAT DE PRODUCTION', pageWidth / 2, yPos + 6, { align: 'center' });
  
  doc.setLineWidth(0.8);
  doc.line(margin, yPos + 10, pageWidth - margin, yPos + 10);

  yPos += 15;

  // Date d'édition et période
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(`Édité le : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, yPos, { align: 'right' });
  yPos += 5;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(`Période : ${periodLabel}`, pageWidth - margin, yPos, { align: 'right' });

  yPos += 10;

  // ============================================================
  // SECTION 1 : PRODUCTION
  // ============================================================
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('PRODUCTION', margin, yPos);
  yPos += 8;

  if (!productions || productions.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Aucune production', margin, yPos);
    yPos += 15;
  } else {
    const production = productions[0]; // Une seule production
    const SACS_PAR_PALETTE = 64;
    const totalQuantite = Number(production.quantite_produite);
    const totalPalettes = totalQuantite / SACS_PAR_PALETTE;

    const tableData = [
      [
        formatDate(production.date_production),
        production.produit_nom,
        formatQuantite(production.quantite_produite) + ' ' + production.unite,
        formatQuantite(totalPalettes),
        production.operateur || '-',
        production.commentaire || '-'
      ]
    ];

    // Ajouter la ligne des totaux
    tableData.push([
      '',
      'TOTAL',
      formatQuantite(totalQuantite) + ' ' + (production.unite || 'sacs'),
      formatQuantite(totalPalettes),
      '',
      ''
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Produit', 'Quantité', 'Palettes', 'Opérateur', 'Commentaire']],
      body: tableData,
      theme: 'plain',
      styles: {
        fontSize: 8,
        cellPadding: 2,
        font: 'helvetica',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 25 },
        1: { halign: 'left', cellWidth: 45 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 25 },
        4: { halign: 'center', cellWidth: 30 },
        5: { halign: 'left', cellWidth: 'auto' },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data: any) => {
        // Styler la dernière ligne (totaux)
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 9;
          data.cell.styles.lineWidth = 0.8;
        }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 15;
  }

  // ============================================================
  // SECTION 2 : MATIÈRES PREMIÈRES UTILISÉES
  // ============================================================
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('MATIÈRES PREMIÈRES UTILISÉES', margin, yPos);
  yPos += 8;

  if (!matieresPremieresUtilisees || matieresPremieresUtilisees.length === 0) {
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('Aucune matière première utilisée', margin, yPos);
  } else {
    const matieresTableData = matieresPremieresUtilisees.map((matiere, index) => [
      (index + 1).toString(),
      matiere.nom_matiere,
      formatMontant(matiere.quantite_totale) + ' ' + matiere.unite,
      formatMontant(matiere.stock_actuel) + ' ' + matiere.unite
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['N°', 'Matière Première', 'Quantité Utilisée', 'Stock Actuel']],
      body: matieresTableData,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        font: 'helvetica',
        textColor: [0, 0, 0],
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
      },
      headStyles: {
        fillColor: [255, 255, 255],
        textColor: [0, 0, 0],
        fontStyle: 'bold',
        halign: 'center',
        lineWidth: 0.5,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        lineWidth: 0.3,
        lineColor: [0, 0, 0],
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 15 },
        1: { halign: 'left', cellWidth: 80 },
        2: { halign: 'right', cellWidth: 45 },
        3: { halign: 'right', cellWidth: 40 },
      },
      margin: { left: margin, right: margin },
    });
  }

  // Pied de page
  ajouterPiedDePage(doc, pageWidth, pageHeight, margin);

  window.open(doc.output('bloburl'), '_blank');
};

export default { genererEtatProductionsPDF, genererEtatProductionUniquePDF };