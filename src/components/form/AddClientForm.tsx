import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Combobox } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { 
  AlertCircle, 
  CheckCircle2, 
  User, 
  Building2, 
  MapPin,
  Phone,
  Mail,
  FileText,
  Loader2
} from "lucide-react";
import clientService from "@/services/clientService";

interface Ville {
  nom: string;
  wilaya: number;
}

interface AddClientFormData {
  nom: string;
  TypeC: string;
  adresse?: string;
  telephone?: string;
  email?: string;
  numero_rc?: string;
  nif?: string;
  n_article?: string;
  contact?: string;
  assujetti_tva: number;
}

interface AddClientFormProps {
  onSuccess?: () => void;
}

const villesAlgerie: Ville[] = [
  { nom: "Adrar", wilaya: 1 },
  { nom: "Chlef", wilaya: 2 },
  { nom: "Laghouat", wilaya: 3 },
  { nom: "Oum El Bouaghi", wilaya: 4 },
  { nom: "Batna", wilaya: 5 },
  { nom: "Béjaïa", wilaya: 6 },
  { nom: "Biskra", wilaya: 7 },
  { nom: "Béchar", wilaya: 8 },
  { nom: "Blida", wilaya: 9 },
  { nom: "Bouira", wilaya: 10 },
  { nom: "Tamanrasset", wilaya: 11 },
  { nom: "Tébessa", wilaya: 12 },
  { nom: "Tlemcen", wilaya: 13 },
  { nom: "Tiaret", wilaya: 14 },
  { nom: "Tizi Ouzou", wilaya: 15 },
  { nom: "Alger", wilaya: 16 },
  { nom: "Djelfa", wilaya: 17 },
  { nom: "Jijel", wilaya: 18 },
  { nom: "Sétif", wilaya: 19 },
  { nom: "Saïda", wilaya: 20 },
  { nom: "Skikda", wilaya: 21 },
  { nom: "Sidi Bel Abbès", wilaya: 22 },
  { nom: "Annaba", wilaya: 23 },
  { nom: "Guelma", wilaya: 24 },
  { nom: "Constantine", wilaya: 25 },
  { nom: "Médéa", wilaya: 26 },
  { nom: "Mostaganem", wilaya: 27 },
  { nom: "M'Sila", wilaya: 28 },
  { nom: "Mascara", wilaya: 29 },
  { nom: "Ouargla", wilaya: 30 },
  { nom: "Oran", wilaya: 31 },
  { nom: "El Bayadh", wilaya: 32 },
  { nom: "Illizi", wilaya: 33 },
  { nom: "Bordj Bou Arreridj", wilaya: 34 },
  { nom: "Boumerdès", wilaya: 35 },
  { nom: "El Tarf", wilaya: 36 },
  { nom: "Tindouf", wilaya: 37 },
  { nom: "Tissemsilt", wilaya: 38 },
  { nom: "El Oued", wilaya: 39 },
  { nom: "Khenchela", wilaya: 40 },
  { nom: "Souk Ahras", wilaya: 41 },
  { nom: "Tipaza", wilaya: 42 },
  { nom: "Mila", wilaya: 43 },
  { nom: "Aïn Defla", wilaya: 44 },
  { nom: "Naâma", wilaya: 45 },
  { nom: "Aïn Témouchent", wilaya: 46 },
  { nom: "Ghardaïa", wilaya: 47 },
  { nom: "Relizane", wilaya: 48 },
];

export function AddClientForm({ onSuccess }: AddClientFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [villeQuery, setVilleQuery] = useState("");
  const [selectedVille, setSelectedVille] = useState<Ville | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [clientTypes, setClientTypes] = useState<string[]>([]);
  const [loadingTypes, setLoadingTypes] = useState(true);

  const form = useForm<AddClientFormData>({
    defaultValues: {
      nom: "",
      TypeC: "Entreprise",
      adresse: "",
      telephone: "",
      email: "",
      numero_rc: "",
      nif: "",
      n_article: "",
      contact: "",
      assujetti_tva: 1,
    },
  });

  // Charger les types de clients depuis la BDD
  useEffect(() => {
    const fetchTypes = async () => {
      try {
        setLoadingTypes(true);
        const response = await clientService.getTypes();
        const types = response.data.map((t: any) => t.TypeC);
        setClientTypes(types.length > 0 ? types : ["Entreprise", "Particulier", "Grossiste"]);
      } catch (error) {
        console.error("Erreur lors du chargement des types:", error);
        setClientTypes(["Entreprise", "Particulier", "Grossiste"]);
      } finally {
        setLoadingTypes(false);
      }
    };

    fetchTypes();
  }, []);

  const filteredVilles =
    villeQuery === ""
      ? villesAlgerie
      : villesAlgerie.filter((v) =>
          v.nom
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .includes(
              villeQuery
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
            )
        );

  const handleSubmit = async (data: AddClientFormData) => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const clientData: AddClientFormData = {
        ...data,
        adresse: selectedVille
          ? `${selectedVille.nom}, Wilaya ${selectedVille.wilaya}`
          : data.adresse,
      };

      console.log("Données envoyées au backend:", clientData);

      await clientService.create(clientData);

      if (onSuccess) {
        onSuccess();
      }

      form.reset();
      setVilleQuery("");
      setSelectedVille(null);
    } catch (error: any) {
      if (error.message.includes("UNIQUE constraint failed: Client.nom")) {
        setSubmitError("Ce client existe déjà !");
      } else {
        console.error("Erreur lors de la création du client:", error);
        setSubmitError(error.message || "Une erreur est survenue");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full border-0 shadow-none bg-transparent">
      <CardContent className="p-0">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Message d'erreur */}
            {submitError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erreur</AlertTitle>
                <AlertDescription>{submitError}</AlertDescription>
              </Alert>
            )}

            {/* Section Informations principales */}
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <User className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Informations principales</h3>
              </div>

              <FormField
                control={form.control}
                name="nom"
                rules={{ required: "Le nom est requis" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom / Raison Sociale *</FormLabel>
                    <FormControl>
                      <Input placeholder="Entreprise ABC ou Ahmed Bennour" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="TypeC"
                rules={{ required: "Le type est requis" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Type de client *
                    </FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={loadingTypes}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={loadingTypes ? "Chargement..." : "Sélectionnez un type"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loadingTypes ? (
                          <div className="flex items-center justify-center p-4">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        ) : (
                          clientTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Type de relation commerciale avec le client
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div>
                <Label className="text-sm font-medium mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Ville
                </Label>
                <Combobox value={selectedVille} onChange={setSelectedVille}>
                  <div className="relative">
                    <Combobox.Input
                      className="border border-slate-200 rounded-md px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                      onChange={(e) => setVilleQuery(e.target.value)}
                      displayValue={(v: Ville | null) =>
                        v ? `${v.nom} (Wilaya ${v.wilaya})` : ""
                      }
                      placeholder="Rechercher une ville..."
                    />
                    <Combobox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-lg">
                      {filteredVilles.length === 0 ? (
                        <div className="p-3 text-gray-500">Aucune ville trouvée</div>
                      ) : (
                        filteredVilles.map((v) => (
                          <Combobox.Option
                            key={v.wilaya}
                            value={v}
                            className={({ active }) =>
                              `cursor-pointer select-none p-3 ${
                                active ? "bg-blue-500 text-white" : ""
                              }`
                            }
                          >
                            {({ selected }) => (
                              <div className="flex justify-between items-center">
                                <span>{v.nom} (Wilaya {v.wilaya})</span>
                                {selected && <CheckCircle2 className="w-5 h-5" />}
                              </div>
                            )}
                          </Combobox.Option>
                        ))
                      )}
                    </Combobox.Options>
                  </div>
                </Combobox>
                {selectedVille && (
                  <div className="mt-2 text-sm text-gray-600 bg-blue-50 p-3 rounded-md flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-blue-600" />
                    <span>
                      {selectedVille.nom}, Wilaya {selectedVille.wilaya}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Section Contact */}
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Phone className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Coordonnées</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Téléphone
                      </FormLabel>
                      <FormControl>
                        <Input placeholder="0555123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email
                      </FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="contact@exemple.dz" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Personne de contact
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="M. Ahmed Bennour" {...field} />
                    </FormControl>
                    <FormDescription>
                      Nom de la personne à contacter
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section Documents commerciaux */}
            <div className="bg-white rounded-lg border p-6 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="h-5 w-5 text-primary" />
                <h3 className="text-lg font-semibold">Documents commerciaux</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="numero_rc"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Numéro RC</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="nif"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>NIF</FormLabel>
                      <FormControl>
                        <Input placeholder="789012" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="n_article"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>N° Article</FormLabel>
                      <FormControl>
                        <Input placeholder="345678" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Boutons d'action */}
            <div className="flex gap-3 pt-4">
              <Button
                type="submit"
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Création en cours..." : "Créer le client"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setSelectedVille(null);
                  setVilleQuery("");
                  setSubmitError(null);
                }}
                disabled={isSubmitting}
              >
                Réinitialiser
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <label className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${className}`}>
      {children}
    </label>
  );
}