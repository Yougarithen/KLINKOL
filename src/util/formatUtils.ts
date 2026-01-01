/**
 * Formate un nombre en devise (DZD - Dinar Algérien)
 * @param amount - Montant à formater
 * @returns Montant formaté avec symbole de devise
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("fr-DZ", {
    style: "currency",
    currency: "DZD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formate un nombre sans symbole de devise
 * @param amount - Montant à formater
 * @returns Montant formaté
 */
export const formatNumber = (amount: number): string => {
  return new Intl.NumberFormat("fr-DZ", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

/**
 * Formate une date au format français
 * @param dateString - Date à formater (ISO string)
 * @returns Date formatée (JJ/MM/AAAA)
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

/**
 * Formate une date avec l'heure
 * @param dateString - Date à formater (ISO string)
 * @returns Date et heure formatées
 */
export const formatDateTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Calcule le nombre de jours entre deux dates
 * @param date1 - Première date
 * @param date2 - Deuxième date
 * @returns Nombre de jours de différence
 */
export const daysBetween = (date1: Date, date2: Date): number => {
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};