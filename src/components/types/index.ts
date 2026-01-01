export interface ClientType {
  id: string;
  nom: string;
  adresse: string;
  telephone: string;
  email: string;
  type: "particulier" | "entreprise" | "grossiste";
  totalAchats: number;
  creance: number;
  numeroRc: string;
  nif: string;
  assujettiTva: boolean;
}