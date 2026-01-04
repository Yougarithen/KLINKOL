// utils/clientInfoPdfGenerator.ts
import jsPDF from 'jspdf';
import LogoImg from '@/assets/Logo.png';

interface ClientInfo {
  id: string;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  TypeC: string;
  numeroRc?: string;
  numero_rc?: string;
  nif?: string;
  n_article?: string;
  contact?: string;
  totalAchats?: number;
  creance?: number;
}

/**
 * Génère un PDF avec les informations détaillées d'un client
 */
export const genererFicheClientPDF = async (client: ClientInfo) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;
  const margin = 20;
  let yPos = 20;

  // ============================================================
  // EN-TÊTE AVEC LOGO
  // ============================================================
  
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
  doc.text('FICHE CLIENT', pageWidth / 2, yPos + 6, { align: 'center' });
  
  doc.setLineWidth(0.8);
  doc.line(margin, yPos + 10, pageWidth - margin, yPos + 10);

  yPos += 20;

  // Date d'édition
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(40, 40, 40);
  doc.text(`Édité le : ${new Date().toLocaleDateString('fr-FR')}`, pageWidth - margin - 5, yPos, { align: 'right' });

  yPos += 10;

  // ============================================================
  // IDENTIFIANT CLIENT
  // ============================================================
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 100, 100);
  doc.text('Référence Client', margin, yPos);
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(client.id, margin, yPos + 7);

  yPos += 15;

  // ============================================================
  // SECTION : INFORMATIONS GÉNÉRALES
  // ============================================================
  
  // Titre de section
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('INFORMATIONS GÉNÉRALES', margin + 3, yPos + 5.5);
  
  yPos += 12;

  // Contenu de la section
  const generalInfo = [
    { label: 'Nom / Raison Sociale', value: client.nom },
    { label: 'Type de Client', value: client.TypeC },
    { label: 'Contact', value: client.contact || '-' },
  ];

  generalInfo.forEach(info => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(info.label, margin + 5, yPos);
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(info.value, margin + 5, yPos + 5);
    
    yPos += 12;
  });

  yPos += 5;

  // ============================================================
  // SECTION : COORDONNÉES (en 3 colonnes)
  // ============================================================
  
  // Titre de section
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('COORDONNÉES', margin + 3, yPos + 5.5);
  
  yPos += 12;

  // Calculer la largeur de chaque colonne
  const contentWidth = pageWidth - 2 * margin;
  const columnWidth = contentWidth / 3;
  
  const contactInfo = [
    { label: 'Adresse', value: client.adresse || '-', icon: '📍' },
    { label: 'Téléphone', value: client.telephone || '-', icon: '📞' },
    { label: 'Email', value: client.email || '-', icon: '📧' },
  ];

  const startY = yPos;
  let maxHeight = 0;

  contactInfo.forEach((info, index) => {
    const colX = margin + 5 + (index * columnWidth);
    let currentY = startY;
    
    // Label
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(info.label, colX, currentY);
    currentY += 5;
    
    // Valeur (avec gestion du texte long)
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    
    const maxWidth = columnWidth - 10;
    const lines = doc.splitTextToSize(info.value, maxWidth);
    doc.text(lines, colX, currentY);
    
    const height = lines.length * 4;
    if (height > maxHeight) maxHeight = height;
  });

  yPos += maxHeight + 10;

  // ============================================================
  // SECTION : INFORMATIONS FISCALES (en 3 colonnes)
  // ============================================================
  
  // Titre de section
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPos, pageWidth - 2 * margin, 8, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('INFORMATIONS FISCALES', margin + 3, yPos + 5.5);
  
  yPos += 12;

  // Contenu en 3 colonnes
  const fiscalInfo = [
    { label: 'Numéro RC', value: client.numeroRc || client.numero_rc || '-' },
    { label: 'NIF', value: client.nif || '-' },
    { label: 'N° Article', value: client.n_article || '-' },
  ];

  const fiscalStartY = yPos;

  fiscalInfo.forEach((info, index) => {
    const colX = margin + 5 + (index * columnWidth);
    let currentY = fiscalStartY;
    
    // Label
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 100, 100);
    doc.text(info.label, colX, currentY);
    currentY += 5;
    
    // Valeur
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(info.value, colX, currentY);
  });

  yPos += 12;

  // ============================================================
  // PIED DE PAGE (avec marge de sécurité)
  // ============================================================
  
  // S'assurer qu'il y a assez d'espace pour le pied de page
  const footerY = pageHeight - 20;
  const minSpaceForFooter = 15;
  
  // Si le contenu est trop proche du pied de page, ajouter une nouvelle page
  if (yPos > footerY - minSpaceForFooter) {
    doc.addPage();
    yPos = 20;
  }
  
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

  // Ouvrir le PDF dans un nouvel onglet
  window.open(doc.output('bloburl'), '_blank');
};

export default { genererFicheClientPDF };