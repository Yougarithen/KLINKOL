// utils/pdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import logoKlinkol from '@/assets/klinkol-logo.png';

interface LigneFacture {
  id_produit: number;
  produit_nom?: string;
  designation?: string;
  unite_vente?: string;
  quantite: number;
  prix_unitaire_ht: number;
  taux_tva?: number;
  remise_ligne?: number;
  description?: string;
}

interface ClientData {
  nom: string;
  rc?: string;
  nif?: string;
  n_art?: string;
  nis?: string;
  ville?: string;
  adresse?: string;
  telephone?: string;
  email?: string;
}

interface FactureData {
  numero_facture: string;
  date_facture: string;
  date_echeance?: string;
  client: string;
  lignes: LigneFacture[];
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  remise_globale?: number;
  montant_remise?: number;
  conditions_paiement?: string;
  notes?: string;
  adresse_livraison?: string;
  validite_devis?: string;
  etabli_par?: string;
}

const formatMontant = (montant: number): string => {
  if (montant === null || montant === undefined || isNaN(montant)) {
    return '0,00';
  }
  return montant.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

export const genererFacturePDF = (facture: FactureData, client: ClientData, type: 'facture' | 'devis' = 'facture') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  let yPos = 15;

  // ============================================================
  // EN-TÊTE
  // ============================================================
  try {
    doc.addImage(logoKlinkol, 'PNG', 15, yPos, 25, 25);
  } catch (e) {
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('[LOGO]', 27.5, yPos + 12.5, { align: 'center' });
  }

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SARL SMS MONODORA', pageWidth / 2, yPos + 8, { align: 'center' });
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Fabrication de Divers produits de La Chimie Minérale', pageWidth / 2, yPos + 14, { align: 'center' });
  doc.text('Cité la Carrière Kherrata, Wilaya de Bejaia', pageWidth / 2, yPos + 19, { align: 'center' });

  // QR CODE
  doc.setDrawColor(0);
  doc.setLineWidth(0.5);
  doc.rect(pageWidth - 35, yPos + 2, 20, 20);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('QR', pageWidth - 25, yPos + 13, { align: 'center' });

  yPos += 35;

  // ============================================================
  // INFOS DOCUMENT & CLIENT
  // ============================================================
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(type === 'devis' ? 'Devis' : 'Facture', 15, yPos);

  let leftYPos = yPos + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`N° : ${facture.numero_facture || 'N/A'}`, 15, leftYPos);
  
  leftYPos += 6;
  const dateFacture = facture.date_facture 
    ? new Date(facture.date_facture).toLocaleDateString('fr-FR')
    : 'N/A';
  doc.text(`Date : ${dateFacture}`, 15, leftYPos);

  const clientBoxX = 110;
  const clientBoxY = yPos - 5;
  const clientBoxWidth = pageWidth - clientBoxX - 15;
  const clientBoxHeight = 50;

  doc.setFillColor(240, 240, 240);
  doc.setDrawColor(180, 180, 180);
  doc.setLineWidth(0.5);
  doc.rect(clientBoxX, clientBoxY, clientBoxWidth, clientBoxHeight, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('CLIENT', clientBoxX + 5, clientBoxY + 6);

  doc.setFontSize(11);
  doc.text(client?.nom || 'Client inconnu', clientBoxX + 5, clientBoxY + 13);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  let clientYPos = clientBoxY + 19;

  doc.text(`RC N°: ${client?.rc || ''}`, clientBoxX + 5, clientYPos); clientYPos += 5;
  doc.text(`NIF : ${client?.nif || ''}`, clientBoxX + 5, clientYPos); clientYPos += 5;
  doc.text(`N° Art: ${client?.n_art || ''}`, clientBoxX + 5, clientYPos); clientYPos += 5;

  if (client?.ville || client?.adresse) {
    doc.setFont('helvetica', 'bold');
    doc.text(client.ville || client.adresse || '', clientBoxX + 5, clientYPos);
    clientYPos += 5;
  }
  doc.setFont('helvetica', 'normal');
  doc.text(`CONTACT : ${client?.telephone || ''}`, clientBoxX + 5, clientYPos);

  yPos += 60;

  // ============================================================
  // TABLEAU
  // ============================================================
  if (!facture.lignes || facture.lignes.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(200, 0, 0);
    doc.text('Aucune ligne de facture', 15, yPos);
    return;
  }

  const montantHT = Number(facture.montant_ht) || 0;
  const montantRemise = Number(facture.montant_remise) || 0;
  const montantTVA = Number(facture.montant_tva) || 0;
  const montantTTC = Number(facture.montant_ttc) || 0;

  const tableData = facture.lignes.map((ligne, index) => {
    const pu = Number(ligne.prix_unitaire_ht) || 0;
    const qte = Number(ligne.quantite) || 0;
    const remise = Number(ligne.remise_ligne) || 0;
    return [
      (index + 1).toString(),
      ligne.produit_nom || ligne.designation || `Produit #${ligne.id_produit}`,
      ligne.unite_vente || 'U',
      qte.toString(),
      formatMontant(pu),
      formatMontant(pu * qte * (1 - remise / 100))
    ];
  });

  const nbLignesProduits = tableData.length;

  tableData.push(
    ['', '', '', 'Montant HT', '', formatMontant(montantHT)],
    ['', '', '', 'Remise', '', montantRemise > 0 ? formatMontant(montantRemise) : ''],
    ['', '', '', 'Total HT', '', formatMontant(montantHT - montantRemise)],
    ['', '', '', 'TVA 19 %', '', formatMontant(montantTVA)],
    ['', '', '', 'Total TTC', '', formatMontant(montantTTC)]
  );

  let finalTableY = yPos;
  autoTable(doc, {
    startY: yPos,
    margin: { left: 15, right: 15 },
    head: [['N°', 'Désignation', 'Unité', 'Quantité', 'Prix U HT', 'Montant HT']],
    body: tableData,
    theme: 'grid',
    styles: { fontSize: 9, cellPadding: 2.5, textColor: [0, 0, 0], lineColor: [0, 0, 0], lineWidth: 0.3 },
    headStyles: { fillColor: [245, 245, 245], fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { halign: 'center', cellWidth: 12 },
      1: { halign: 'left' },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 25 },
      5: { halign: 'right', cellWidth: 30 },
    },
    willDrawCell: (data) => {
      if (data.row.index >= nbLignesProduits && (data.column.index <= 2 || data.column.index === 4)) {
        return false;
      }
    },
    didDrawCell: (data) => {
      if (data.row.index >= nbLignesProduits) {
        const cell = data.cell;
        const isLastRow = data.row.index === tableData.length - 1;
        const gray = isLastRow ? 240 : 255;

        if (data.column.index <= 2) {
          doc.setFillColor(255, 255, 255);
          doc.rect(cell.x, cell.y, cell.width, cell.height, 'F');
        }
        
        if (data.column.index === 3) {
          const mergedWidth = cell.width + (data.row.cells[4]?.width || 0);
          doc.setFillColor(gray, gray, gray);
          doc.rect(cell.x, cell.y, mergedWidth, cell.height, 'F');
          doc.setDrawColor(0);
          doc.rect(cell.x, cell.y, mergedWidth, cell.height, 'S');
          doc.setFont('helvetica', 'bold');
          const textY = cell.y + cell.height / 2 + doc.getFontSize() / 3;
          doc.text(cell.text[0], cell.x + 2, textY);
        }

        if (data.column.index === 5) {
          doc.setFillColor(gray, gray, gray);
          doc.rect(cell.x, cell.y, cell.width, cell.height, 'F');
          doc.setDrawColor(0);
          doc.rect(cell.x, cell.y, cell.width, cell.height, 'S');
          doc.setFont('helvetica', 'bold');
          const textY = cell.y + cell.height / 2 + doc.getFontSize() / 3;
          doc.text(cell.text[0], cell.x + cell.width - 2, textY, { align: 'right' });
        }
      }
    },
    didDrawPage: (data) => { finalTableY = data.cursor?.y || yPos; }
  });

  // ============================================================
  // BAS DE PAGE
  // ============================================================
  yPos = finalTableY + 10;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Arrêté le Montant de la Présente ${type === 'devis' ? 'Devis' : 'Facture'} en Toutes Taxe Comprise à la somme de :`, 15, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text(nombreEnLettres(montantTTC) + ' Dinars', 15, yPos);

  const infosY = pageHeight - 50;
  doc.setFont('helvetica', 'normal');
  doc.text('Adresse Site :', 15, infosY);
  doc.text(facture.adresse_livraison || 'ENPI EL EULMA', 50, infosY);
  doc.text('Livraison sur site:', 15, infosY + 5);
  doc.text('Prix livré sur site', 50, infosY + 5);
  doc.text('Validité du devis :', 15, infosY + 10);
  doc.text(facture.validite_devis || '30 jours', 50, infosY + 10);
  doc.text('Devis établi par :', 15, infosY + 15);
  doc.text(facture.etabli_par || 'S DJOUADI', 50, infosY + 15);

  const footerY = pageHeight - 15;
  doc.setFontSize(7);
  doc.text('RC : 17B 0189221 06/00    N°Art: 0644 05024 76    NIF : 001706018922155    Tel /Fax 034 39 29 99', pageWidth / 2, footerY, { align: 'center' });
  doc.text('91 Site Web : www.klinkol.com Email : contact@klinkol.com', pageWidth / 2, footerY + 4, { align: 'center' });

  window.open(doc.output('bloburl'), '_blank');
};

/** * Conversion simplifiée 
 */
function nombreEnLettres(nombre: number): string {
  if (!nombre || isNaN(nombre) || nombre === 0) return 'zéro';
  const parties = Math.floor(nombre);
  const milliers = Math.floor(parties / 1000);
  const reste = parties % 1000;

  let resultat = '';
  if (milliers > 0) {
    resultat += (milliers === 1 ? 'mille' : convertirMoinsDeMillle(milliers) + ' mille') + ' ';
  }
  if (reste > 0) {
    resultat += convertirMoinsDeMillle(reste);
  }
  return resultat.trim();
}

function convertirMoinsDeMillle(n: number): string {
  if (n >= 100) {
    const centaines = Math.floor(n / 100);
    const reste = n % 100;
    let res = centaines === 1 ? 'cent' : convertirMoinsDeCent(centaines) + ' cent';
    if (reste > 0) res += ' ' + convertirMoinsDeCent(reste);
    return res;
  }
  return convertirMoinsDeCent(n);
}

function convertirMoinsDeCent(n: number): string {
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  const special = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

  if (n < 10) return unites[n];
  if (n >= 10 && n < 20) return special[n - 10];
  const diz = Math.floor(n / 10);
  const unit = n % 10;
  if (unit === 0) return (diz === 8) ? 'quatre-vingts' : dizaines[diz];
  if (diz === 7) return 'soixante-' + special[unit];
  if (diz === 9) return 'quatre-vingt-' + special[unit];
  return dizaines[diz] + '-' + unites[unit];
}

export default genererFacturePDF;