// utils/produitPdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LogoImg from '@/assets/Logo.png';

interface ProduitProduction {
  nom_produit: string;
  code_produit: string;
  quantite_produite: number;
  unite: string;
  nombre_lots: number;
  nombre_palettes: number;
}

interface ProduitVente {
  nom_produit: string;
  code_produit: string;
  quantite_vendue: number;
  unite: string;
  montant_total: number;
  nombre_factures: number;
  factures_ids?: string[]; // IDs des factures concernées
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
 * Génère un PDF de l'état global des produits (productions et ventes)
 */
export const genererEtatProduitsPDF = async (
  produitsProduction: ProduitProduction[],
  produitsVente: ProduitVente[],
  periodLabel: string
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;

  // ============================================================
  // PAGE 1 : PRODUITS PRODUITS
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
  doc.text('ÉTAT DES PRODUITS - PRODUCTION', pageWidth / 2, yPos + 6, { align: 'center' });
  
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

  // Tableau des produits produits (SANS colonne Nb Lots)
  if (!produitsProduction || produitsProduction.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Aucun produit fabriqué pour cette période', pageWidth / 2, yPos + 20, { align: 'center' });
  } else {
    // Calculer les totaux
    const totalQuantite = produitsProduction.reduce((acc, p) => acc + Number(p.quantite_produite), 0);
    const totalPalettes = produitsProduction.reduce((acc, p) => acc + Number(p.nombre_palettes), 0);

    const tableData = produitsProduction.map((prod, index) => [
      (index + 1).toString(),
      prod.code_produit || '-',
      prod.nom_produit,
      formatQuantite(prod.quantite_produite) + ' ' + prod.unite,
      prod.nombre_palettes.toString()
    ]);

    // Ajouter la ligne des totaux
    tableData.push([
      '',
      '',
      'TOTAL',
      formatQuantite(totalQuantite),
      totalPalettes.toString()
    ]);

    // Calculer les largeurs pour centrer le tableau
    const tableWidth = 15 + 30 + 70 + 35 + 25; // Total = 175
    const leftMargin = (pageWidth - tableWidth) / 2;

    autoTable(doc, {
      startY: yPos,
      head: [['N°', 'Code', 'Produit', 'Quantité Produite', 'Palettes']],
      body: tableData,
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
        1: { halign: 'center', cellWidth: 30 },
        2: { halign: 'left', cellWidth: 70 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'center', cellWidth: 25 },
      },
      margin: { left: leftMargin, right: leftMargin },
      tableWidth: 'wrap',
      didParseCell: (data: any) => {
        // Styler la dernière ligne (totaux)
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 10;
          data.cell.styles.lineWidth = 0.8;
        }
      }
    });
  }

  // Pied de page
  ajouterPiedDePage(doc, pageWidth, pageHeight, margin);

  // ============================================================
  // PAGE 2 : PRODUITS VENDUS
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
  doc.text('ÉTAT DES PRODUITS - VENTES', pageWidth / 2, yPos + 6, { align: 'center' });
  
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

  // Tableau des produits vendus (AVEC IDs factures et centré)
  if (!produitsVente || produitsVente.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Aucun produit vendu pour cette période', pageWidth / 2, yPos + 20, { align: 'center' });
  } else {
    // Calculer les totaux
    const totalQuantite = produitsVente.reduce((acc, p) => acc + Number(p.quantite_vendue), 0);
    const totalMontant = produitsVente.reduce((acc, p) => acc + Number(p.montant_total), 0);

    const tableData = produitsVente.map((prod, index) => [
      (index + 1).toString(),
      prod.code_produit || '-',
      prod.nom_produit,
      formatQuantite(prod.quantite_vendue) + ' ' + prod.unite,
      prod.factures_ids && prod.factures_ids.length > 0 ? prod.factures_ids.join(', ') : '-',
      formatMontant(prod.montant_total) + ' DZD'
    ]);

    // Ajouter la ligne des totaux
    tableData.push([
      '',
      '',
      '',
      '',
      'TOTAL',
      formatMontant(totalMontant) + ' DZD'
    ]);

    // Calculer les largeurs pour centrer le tableau
    const tableWidth = 12 + 25 + 50 + 30 + 35 + 38; // Total = 190
    const leftMargin = (pageWidth - tableWidth) / 2;

    autoTable(doc, {
      startY: yPos,
      head: [['N°', 'Code', 'Produit', 'Quantité Vendue', 'N° Factures', 'Montant Total']],
      body: tableData,
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
        0: { halign: 'center', cellWidth: 12 },
        1: { halign: 'center', cellWidth: 25 },
        2: { halign: 'left', cellWidth: 50 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'center', cellWidth: 35 },
        5: { halign: 'right', cellWidth: 38 },
      },
      margin: { left: leftMargin, right: leftMargin },
      tableWidth: 'wrap',
      didParseCell: (data: any) => {
        // Styler la dernière ligne (totaux)
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 10;
          data.cell.styles.lineWidth = 0.8;
        }
      }
    });
  }

  // Pied de page
  ajouterPiedDePage(doc, pageWidth, pageHeight, margin);

  // Ouvrir le PDF
  window.open(doc.output('bloburl'), '_blank');
};

export default { genererEtatProduitsPDF };