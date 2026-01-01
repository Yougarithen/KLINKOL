// utils/pdfGenerator.ts
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
  client: string; // Nom du client (string) venant du backend
  lignes: LigneFacture[];
  montant_ht: number;
  montant_tva: number;
  montant_ttc: number;
  remise_globale?: number;
  montant_remise?: number;
  conditions_paiement?: string;
  notes?: string;
}

// ✅ Fonction helper pour formater les montants
const formatMontant = (montant: number): string => {
  if (montant === null || montant === undefined || isNaN(montant)) {
    return '0,00';
  }
  return montant.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
};

// ✅ SIGNATURE CORRIGÉE : accepte facture ET client séparément
export const genererFacturePDF = (facture: FactureData, client: ClientData, type: 'facture' | 'devis' = 'facture') => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  
  const margin = 20;
  const marginRight = 20;
  let yPos = 20;

  console.log('📄 Génération PDF:', { facture, client });

  // ============================================================
  // EN-TÊTE
  // ============================================================
  
  doc.setFillColor(41, 98, 255);
  doc.circle(30, yPos + 5, 10, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('SK', 30, yPos + 8, { align: 'center' });

  doc.setTextColor(40, 40, 40);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text('SARL SMS MONODORA', pageWidth / 2, yPos, { align: 'center' });
  
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(80, 80, 80);
  doc.text('Fabrication de Divers produits de La Chimie Minerale', pageWidth / 2, yPos + 6, { align: 'center' });
  doc.text('Cite la Carriere Kherrata, Wilaya de Bejaia', pageWidth / 2, yPos + 11, { align: 'center' });

  // QR Code
  doc.setDrawColor(0);
  doc.rect(pageWidth - 30, yPos - 5, 20, 20);
  doc.setFontSize(6);
  doc.text('QR', pageWidth - 20, yPos + 5, { align: 'center' });

  yPos += 35;

  // ============================================================
  // TITRE ET INFORMATIONS CLIENT
  // ============================================================
  
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(type === 'devis' ? 'Devis' : 'Facture', margin, yPos);

  // Encadré CLIENT
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.rect(pageWidth / 2 + 10, yPos - 5, pageWidth / 2 - 30, 50, 'FD');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  doc.text('CLIENT', pageWidth / 2 + 15, yPos + 2);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  // ✅ Utiliser client.nom au lieu de facture.client
  doc.text(client?.nom || 'Client inconnu', pageWidth / 2 + 15, yPos + 9);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(70, 70, 70);
  let clientYPos = yPos + 15;
  
  // ✅ Affichage prioritaire : RC, NIF, N° Art, Contact
  if (client?.rc) {
    doc.text(`RC N°: ${client.rc}`, pageWidth / 2 + 15, clientYPos);
    clientYPos += 5;
  }
  
  if (client?.nif) {
    doc.text(`NIF: ${client.nif}`, pageWidth / 2 + 15, clientYPos);
    clientYPos += 5;
  }
  
  if (client?.n_art) {
    doc.text(`N° Art: ${client.n_art}`, pageWidth / 2 + 15, clientYPos);
    clientYPos += 5;
  }
  
  // NIS si disponible
  if (client?.nis) {
    doc.text(`NIS: ${client.nis}`, pageWidth / 2 + 15, clientYPos);
    clientYPos += 5;
  }
  
  // Adresse ou ville
  if (client?.adresse) {
    doc.text(client.adresse, pageWidth / 2 + 15, clientYPos);
    clientYPos += 5;
  } else if (client?.ville) {
    doc.text(client.ville, pageWidth / 2 + 15, clientYPos);
    clientYPos += 5;
  }
  
  // Contact (téléphone)
  if (client?.telephone) {
    doc.text(`Tel: ${client.telephone}`, pageWidth / 2 + 15, clientYPos);
    clientYPos += 5;
  }
  
  // Email si disponible
  if (client?.email) {
    doc.setFontSize(8);
    doc.text(client.email, pageWidth / 2 + 15, clientYPos);
  }

  // Numéro et date
  yPos += 7;
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text(`N° : ${facture.numero_facture || 'N/A'}`, margin, yPos);
  yPos += 5;
  doc.setTextColor(70, 70, 70);
  
  // ✅ Formatage sécurisé de la date
  const dateFacture = facture.date_facture 
    ? new Date(facture.date_facture).toLocaleDateString('fr-FR')
    : 'N/A';
  doc.text(`Date : ${dateFacture}`, margin, yPos);

  yPos += 35;

  // ============================================================
  // TABLEAU DES PRODUITS
  // ============================================================
  
  // ✅ Vérification des lignes
  if (!facture.lignes || facture.lignes.length === 0) {
    doc.setFontSize(12);
    doc.setTextColor(200, 0, 0);
    doc.text('Aucune ligne de facture', margin, yPos);
    window.open(doc.output('bloburl'), '_blank');
    return;
  }

  const tableData = facture.lignes.map((ligne, index) => {
    // ✅ Calcul sécurisé des montants
    const prixUnitaire = Number(ligne.prix_unitaire_ht) || 0;
    const quantite = Number(ligne.quantite) || 0;
    const remiseLigne = Number(ligne.remise_ligne) || 0;
    
    const montantHT = prixUnitaire * quantite * (1 - remiseLigne / 100);
    
    return [
      (index + 1).toString(),
      ligne.produit_nom || ligne.designation || `Produit #${ligne.id_produit}`,
      ligne.unite_vente || 'U',
      quantite.toString(),
      formatMontant(prixUnitaire),
      formatMontant(montantHT)
    ];
  });

  const tableWidth = 170;
  const tableStartX = (pageWidth - tableWidth) / 2;
  
  let finalTableY = yPos;
  
  autoTable(doc, {
    startY: yPos,
    margin: { left: tableStartX, right: (pageWidth - tableWidth - tableStartX) },
    tableWidth: tableWidth,
    head: [['N°', 'Désignation', 'Unité', 'Quantité', 'Prix U HT', 'Montant HT']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 9,
      cellPadding: 3,
      font: 'helvetica',
      lineColor: [200, 200, 200],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [245, 245, 245],
      textColor: [60, 60, 60],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 10 },
      1: { halign: 'left', cellWidth: 75 },
      2: { halign: 'center', cellWidth: 15 },
      3: { halign: 'center', cellWidth: 18 },
      4: { halign: 'right', cellWidth: 26 },
      5: { halign: 'right', cellWidth: 26 },
    },
    didDrawPage: (data: any) => {
      finalTableY = data.cursor.y;
    }
  });

  yPos = finalTableY;

  // ============================================================
  // TOTAUX
  // ============================================================
  
  yPos += 5;
  
  const tableEndX = tableStartX + tableWidth;
  const totauxWidth = 70;
  const totauxStartX = tableEndX - totauxWidth;
  const totauxLabelX = totauxStartX + 5;
  const totauxX = tableEndX - 5;

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(60, 60, 60);
  
  // ✅ Conversion sécurisée de tous les montants
  const montantHT = Number(facture.montant_ht) || 0;
  const remiseGlobale = Number(facture.remise_globale) || 0;
  const montantRemise = Number(facture.montant_remise) || 0;
  const montantTVA = Number(facture.montant_tva) || 0;
  const montantTTC = Number(facture.montant_ttc) || 0;
  
  console.log('💰 Montants dans PDF:', { montantHT, remiseGlobale, montantRemise, montantTVA, montantTTC });
  
  // Montant HT avant remise
  doc.text('Montant HT', totauxLabelX, yPos);
  doc.text(formatMontant(montantHT), totauxX, yPos, { align: 'right' });
  yPos += 6;

  // TVA avant remise
  doc.text('TVA 19%', totauxLabelX, yPos);
  doc.text(formatMontant(montantTVA), totauxX, yPos, { align: 'right' });
  yPos += 6;

  // Remise globale (si applicable)
  if (remiseGlobale > 0 || montantRemise > 0) {
    doc.setTextColor(255, 100, 0);
    doc.text(`Remise ${remiseGlobale}%`, totauxLabelX, yPos);
    doc.text(`-${formatMontant(montantRemise)}`, totauxX, yPos, { align: 'right' });
    doc.setTextColor(60, 60, 60);
    yPos += 6;
  }

  // Total TTC
  doc.setFontSize(10.5);
  doc.setFillColor(248, 249, 250);
  doc.setDrawColor(220, 220, 220);
  doc.setLineWidth(0.5);
  doc.rect(totauxStartX, yPos - 5, totauxWidth, 8, 'FD');
  doc.setTextColor(40, 40, 40);
  doc.text('Total TTC', totauxLabelX, yPos);
  doc.text(formatMontant(montantTTC), totauxX, yPos, { align: 'right' });

  yPos += 15;

  // ============================================================
  // MONTANT EN LETTRES
  // ============================================================
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(60, 60, 60);
  
  // ✅ Utiliser montantTTC au lieu d'une valeur undefined
  const montantEnLettres = nombreEnLettres(montantTTC);
  
  const texteIntro = "Arrete le Montant de la Presente " + 
                      (type === 'devis' ? 'Devis' : 'Facture') + 
                      " en Toutes Taxes Comprises a la somme de :";
  
  doc.text(texteIntro, margin, yPos);
  yPos += 5;
  doc.setFont('helvetica', 'bold');
  
  // ✅ Vérification que c'est bien une string
  const texteLetters = String(montantEnLettres) + ' Dinars';
  doc.text(texteLetters, margin, yPos);

  // ============================================================
  // PIED DE PAGE
  // ============================================================
  
  yPos = pageHeight - 35;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(70, 70, 70);
  
  if (facture.conditions_paiement) {
    doc.text(`Conditions de paiement : ${facture.conditions_paiement}`, margin, yPos);
    yPos += 5;
  }
  
  if (facture.notes) {
    doc.text(`Notes : ${facture.notes}`, margin, yPos);
    yPos += 5;
  }

  // Coordonnées entreprise
  yPos = pageHeight - 15;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text(
    'RC : 17B 0189221 06/00    N°Art: 0644 05024 76    NIF : 001706018922155    Tel /Fax 034 39 29 99    Mobile : +213 660 372 088 /+213 660 660 692/',
    pageWidth / 2,
    yPos,
    { align: 'center' }
  );
  yPos += 3;
  doc.text(
    '91 Site Web : www.klinkol.com Email : contact@klinkol.com',
    pageWidth / 2,
    yPos + 3,
    { align: 'center' }
  );
  
  doc.text(
    new Date().toLocaleString('fr-FR'),
    pageWidth - margin,
    yPos + 3,
    { align: 'right' }
  );

  // Ouvrir dans un nouvel onglet
  window.open(doc.output('bloburl'), '_blank');
};

// ✅ Fonction pour convertir un nombre en lettres
function nombreEnLettres(nombre: number): string {
  if (!nombre || isNaN(nombre) || nombre === 0) return 'zero';
  if (nombre >= 1000000) return Math.floor(nombre).toString();

  let resultat = '';
  const parties = Math.floor(nombre);
  
  const milliers = Math.floor(parties / 1000);
  if (milliers > 0) {
    if (milliers === 1) {
      resultat += 'mille ';
    } else {
      resultat += convertirMoinsDeMillle(milliers) + ' mille ';
    }
  }

  const reste = parties % 1000;
  if (reste > 0) {
    resultat += convertirMoinsDeMillle(reste);
  }

  return resultat.trim();
}

function convertirMoinsDeMillle(n: number): string {
  if (n >= 100) {
    const centaines = Math.floor(n / 100);
    const reste = n % 100;
    let result = '';
    
    if (centaines === 1) {
      result = 'cent';
    } else {
      const unitNames = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
      result = unitNames[centaines] + ' cent';
    }
    
    if (reste > 0) {
      result += ' ' + convertirMoinsDeCent(reste);
    }
    
    return result;
  }
  return convertirMoinsDeCent(n);
}

function convertirMoinsDeCent(n: number): string {
  const unites = ['', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf'];
  const dizaines = ['', 'dix', 'vingt', 'trente', 'quarante', 'cinquante', 'soixante', 'soixante-dix', 'quatre-vingt', 'quatre-vingt-dix'];
  const special = ['dix', 'onze', 'douze', 'treize', 'quatorze', 'quinze', 'seize', 'dix-sept', 'dix-huit', 'dix-neuf'];

  if (n === 0) return '';
  if (n < 10) return unites[n];
  if (n >= 10 && n < 20) return special[n - 10];
  
  const diz = Math.floor(n / 10);
  const unit = n % 10;
  
  if (unit === 0) {
    if (diz === 8) return 'quatre-vingts';
    return dizaines[diz];
  }
  
  if (diz === 7) {
    return 'soixante-' + special[unit];
  }
  
  if (diz === 9) {
    return 'quatre-vingt-' + special[unit];
  }
  
  return dizaines[diz] + '-' + unites[unit];
}

export default genererFacturePDF;