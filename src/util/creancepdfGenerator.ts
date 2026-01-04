// utils/creancePdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import LogoImg from '@/assets/Logo.png';

interface CreanceClient {
  nom: string;
  totalAchats: number;
  totalPaye: number;
  solde: number;
  factures: {
    numero_facture: string;
    date_facture: string;
    montant_ttc: number;
    montant_paye: number;
    montant_restant: number;
  }[];
}

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

// ✅ Fonction corrigée pour convertir un nombre en lettres (français)
const nombreEnLettres = (nombre: number): string => {
  if (nombre === 0) return 'zéro';
  if (nombre < 0) return 'moins ' + nombreEnLettres(-nombre);
  
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const dizaines = ['', '', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante', 'quatre-vingt', 'quatre-vingt'];
  const speciales = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];
  
  const convertirGroupe = (n: number): string => {
    if (n === 0) return '';
    
    let resultat = '';
    
    // Centaines
    const centaines = Math.floor(n / 100);
    if (centaines > 0) {
      if (centaines === 1) {
        resultat = 'cent';
      } else {
        resultat = unites[centaines] + ' cent';
      }
      if (n % 100 === 0 && centaines > 1) {
        resultat += 's';
      }
    }
    
    const reste = n % 100;
    
    // Dizaines spéciales (10-19)
    if (reste >= 10 && reste < 20) {
      if (resultat) resultat += ' ';
      resultat += speciales[reste - 10];
      return resultat;
    }
    
    // Dizaines
    const diz = Math.floor(reste / 10);
    const unit = reste % 10;
    
    if (diz >= 2) {
      if (resultat) resultat += ' ';
      
      if (diz === 7 || diz === 9) {
        // 70-79 et 90-99
        resultat += dizaines[diz];
        if (unit > 0) {
          resultat += '-' + speciales[unit];
        }
      } else if (diz === 8) {
        // 80-89
        resultat += dizaines[diz];
        if (unit > 0) {
          resultat += '-' + unites[unit];
        } else {
          resultat += 's'; // quatre-vingts
        }
      } else {
        // 20-69
        resultat += dizaines[diz];
        if (unit === 1) {
          resultat += ' et un';
        } else if (unit > 0) {
          resultat += '-' + unites[unit];
        }
      }
    } else if (unit > 0) {
      // Unités simples
      if (resultat) resultat += ' ';
      resultat += unites[unit];
    }
    
    return resultat;
  };
  
  // Traitement par groupes de milliers
  const partieEntiere = Math.floor(nombre);
  
  if (partieEntiere >= 1000000000) {
    // Au-delà du milliard, on retourne le nombre
    return partieEntiere.toString();
  }
  
  let resultat = '';
  
  // Millions
  const millions = Math.floor(partieEntiere / 1000000);
  if (millions > 0) {
    if (millions === 1) {
      resultat = 'un million';
    } else {
      resultat = convertirGroupe(millions) + ' millions';
    }
  }
  
  // Milliers
  const milliers = Math.floor((partieEntiere % 1000000) / 1000);
  if (milliers > 0) {
    if (resultat) resultat += ' ';
    if (milliers === 1) {
      resultat += 'mille';
    } else {
      resultat += convertirGroupe(milliers) + ' mille';
    }
  }
  
  // Unités
  const unitesFinal = partieEntiere % 1000;
  if (unitesFinal > 0) {
    if (resultat) resultat += ' ';
    resultat += convertirGroupe(unitesFinal);
  }
  
  return resultat.trim();
};

/**
 * Génère un PDF de l'état des créances d'un client spécifique
 */
export const genererEtatCreancesClientPDF = async (creanceData: CreanceClient, clientInfo?: any, periodLabel?: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPos = 20;

  // ============================================================
  // EN-TÊTE AVEC LOGO KLINKOL (identique au PDF global)
  // ============================================================
  
  try {
    const img = new Image();
    img.src = LogoImg;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    // Logo à 30 de hauteur
    const logoHeight = 30;
    const logoWidth = (img.width / img.height) * logoHeight;
    
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(img, 'PNG', logoX, yPos, logoWidth, logoHeight);
    yPos += logoHeight + 10;
  } catch (error) {
    console.error('Erreur lors du chargement du logo:', error);
    yPos += 25;
  }

  // Nom entreprise
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SARL SMS MONODORA', pageWidth / 2, yPos, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Fabrication de Divers produits de La Chimie Minerale', pageWidth / 2, yPos + 5, { align: 'center' });
  doc.text('Cite la Carriere Kherrata, Wilaya de Bejaia', pageWidth / 2, yPos + 10, { align: 'center' });

  yPos += 20;

  // ============================================================
  // TITRE DU DOCUMENT
  // ============================================================
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ÉTAT DES CRÉANCES', pageWidth / 2, yPos + 6, { align: 'center' });
  
  doc.setLineWidth(0.8);
  doc.line(margin, yPos + 10, pageWidth - margin, yPos + 10);

  yPos += 20;

  // ============================================================
  // INFORMATIONS CLIENT (avec détails supplémentaires)
  // ============================================================
  
  const infoBoxHeight = clientInfo ? 45 : 30;
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.5);
  doc.rect(margin, yPos - 5, pageWidth - 2 * margin, infoBoxHeight);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CLIENT', margin + 5, yPos + 2);
  
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text(creanceData.nom, margin + 5, yPos + 11);
  
  // Informations supplémentaires du client (si disponibles)
  if (clientInfo) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    let infoY = yPos + 18;
    if (clientInfo.adresse) {
      doc.text(`Adresse : ${clientInfo.adresse}`, margin + 5, infoY);
      infoY += 5;
    }
    if (clientInfo.telephone) {
      doc.text(`Téléphone : ${clientInfo.telephone}`, margin + 5, infoY);
      infoY += 5;
    }
    if (clientInfo.nif) {
      doc.text(`NIF : ${clientInfo.nif}`, margin + 5, infoY);
      infoY += 5;
    }
    if (clientInfo.numero_rc) {
      doc.text(`N° RC : ${clientInfo.numero_rc}`, margin + 5, infoY);
      infoY += 5;
    }
    if (clientInfo.n_article) {
      doc.text(`N° Article : ${clientInfo.n_article}`, margin + 5, infoY);
      infoY += 5;
    }
  }
  
  // Date d'édition et période
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(`Édité le : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin - 5, yPos + 2, { align: 'right' });
  
  if (periodLabel) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Période : ${periodLabel}`, pageWidth - margin - 5, yPos + 8, { align: 'right' });
  }

  yPos += infoBoxHeight + 10;

  // ============================================================
  // TABLEAU DES FACTURES AVEC TOTAUX INTÉGRÉS
  // ============================================================
  
  if (!creanceData.factures || creanceData.factures.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Aucune facture en créance', pageWidth / 2, yPos + 20, { align: 'center' });
    yPos += 30;
  } else {
    // Préparer les lignes du tableau avec les factures
    const tableData = creanceData.factures.map((facture) => [
      formatDate(facture.date_facture),
      facture.numero_facture,
      formatMontant(facture.montant_ttc),
      formatMontant(facture.montant_paye),
      formatMontant(facture.montant_restant)
    ]);

    // Ajouter la ligne des totaux
    tableData.push([
      '',
      'TOTAL',
      formatMontant(creanceData.totalAchats),
      formatMontant(creanceData.totalPaye),
      formatMontant(creanceData.solde)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'N° Facture', 'Total TTC', 'Montant Payé', 'Solde']],
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
        0: { halign: 'center', cellWidth: 30 },
        1: { halign: 'left', cellWidth: 50 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 30 },
      },
      margin: { left: margin, right: margin },
      didParseCell: (data: any) => {
        // Styler la dernière ligne (ligne des totaux)
        if (data.row.index === tableData.length - 1) {
          data.cell.styles.fillColor = [255, 255, 255];
          data.cell.styles.textColor = [0, 0, 0];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.fontSize = 10;
          data.cell.styles.lineWidth = 0.8;
        }
      }
    });

    yPos = (doc as any).lastAutoTable.finalY + 10;
  }

  // ============================================================
  // MONTANT EN LETTRES
  // ============================================================
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(0, 0, 0);
  doc.text('Arrêté le présent état à la somme de :', margin, yPos);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const montantEnLettres = nombreEnLettres(creanceData.solde);
  const texteComplet = `${montantEnLettres.charAt(0).toUpperCase() + montantEnLettres.slice(1)} Dinars Algériens`;
  doc.text(texteComplet, margin, yPos + 6);

  yPos += 15;

  // ============================================================
  // PIED DE PAGE
  // ============================================================
  
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

  window.open(doc.output('bloburl'), '_blank');
};

/**
 * Génère un PDF de l'état des créances de TOUS les clients
 */
export const genererEtatCreancesTousClientsPDF = async (creances: CreanceClient[], periodLabel?: string) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPos = 20;

  // ============================================================
  // EN-TÊTE AVEC LOGO KLINKOL
  // ============================================================
  
  try {
    const img = new Image();
    img.src = LogoImg;
    await new Promise((resolve) => {
      img.onload = resolve;
    });
    
    // Logo à 30 de hauteur
    const logoHeight = 30;
    const logoWidth = (img.width / img.height) * logoHeight;
    
    const logoX = (pageWidth - logoWidth) / 2;
    doc.addImage(img, 'PNG', logoX, yPos, logoWidth, logoHeight);
    yPos += logoHeight + 10;
  } catch (error) {
    console.error('Erreur lors du chargement du logo:', error);
    yPos += 25;
  }

  // Nom entreprise
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('SARL SMS MONODORA', pageWidth / 2, yPos, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 60, 60);
  doc.text('Fabrication de Divers produits de La Chimie Minerale', pageWidth / 2, yPos + 5, { align: 'center' });
  doc.text('Cite la Carriere Kherrata, Wilaya de Bejaia', pageWidth / 2, yPos + 10, { align: 'center' });

  yPos += 20;

  // ============================================================
  // TITRE
  // ============================================================
  
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.8);
  doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('ÉTAT DES CRÉANCES - TOUS LES CLIENTS', pageWidth / 2, yPos + 6, { align: 'center' });
  
  doc.setLineWidth(0.8);
  doc.line(margin, yPos + 10, pageWidth - margin, yPos + 10);

  yPos += 15;

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(`Édité le : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin, yPos, { align: 'right' });

  if (periodLabel) {
    yPos += 5;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(`Période : ${periodLabel}`, pageWidth - margin, yPos, { align: 'right' });
  }

  yPos += 10;

  // ============================================================
  // CALCUL DES TOTAUX GÉNÉRAUX
  // ============================================================
  
  const totaux = creances.reduce((acc, client) => ({
    totalAchats: acc.totalAchats + client.totalAchats,
    totalPaye: acc.totalPaye + client.totalPaye,
    solde: acc.solde + client.solde,
  }), { totalAchats: 0, totalPaye: 0, solde: 0 });

  // ============================================================
  // TABLEAU RÉCAPITULATIF
  // ============================================================
  
  if (!creances || creances.length === 0) {
    doc.setFontSize(11);
    doc.setTextColor(100, 100, 100);
    doc.text('Aucune créance à afficher', pageWidth / 2, yPos + 20, { align: 'center' });
  } else {
    const tableData = creances
      .filter(client => client.solde > 0)
      .map((client) => {
        // Trouver la facture la plus récente du client
        const derniereFacture = client.factures && client.factures.length > 0
          ? client.factures.sort((a, b) => new Date(b.date_facture).getTime() - new Date(a.date_facture).getTime())[0]
          : null;
        
        return [
          derniereFacture ? formatDate(derniereFacture.date_facture) : 'N/A',
          client.nom,
          formatMontant(client.totalAchats),
          formatMontant(client.totalPaye),
          formatMontant(client.solde)
        ];
      });

    tableData.push([
      '',
      'TOTAL GÉNÉRAL',
      formatMontant(totaux.totalAchats),
      formatMontant(totaux.totalPaye),
      formatMontant(totaux.solde)
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [['Date', 'Client', 'Total Achats', 'Total Payé', 'Solde']],
      body: tableData,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 3,
        font: 'helvetica',
        lineColor: [0, 0, 0],
        lineWidth: 0.3,
        textColor: [0, 0, 0],
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
        1: { halign: 'left', cellWidth: 55 },
        2: { halign: 'right', cellWidth: 30 },
        3: { halign: 'right', cellWidth: 30 },
        4: { halign: 'right', cellWidth: 30 },
      },
      margin: { left: (pageWidth - 170) / 2, right: (pageWidth - 170) / 2 },
      didParseCell: (data: any) => {
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

  // ============================================================
  // MONTANT EN LETTRES - VERSION CORRIGÉE
  // ============================================================
  
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(0, 0, 0);
  doc.text('Arrêté le présent état à la somme de :', margin, finalY);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  const montantEnLettres = nombreEnLettres(totaux.solde);
  const texteComplet = `${montantEnLettres.charAt(0).toUpperCase() + montantEnLettres.slice(1)} Dinars Algériens`;
  doc.text(texteComplet, margin, finalY + 6);

  // ============================================================
  // PIED DE PAGE
  // ============================================================
  
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

  window.open(doc.output('bloburl'), '_blank');
};

export default { genererEtatCreancesClientPDF, genererEtatCreancesTousClientsPDF };