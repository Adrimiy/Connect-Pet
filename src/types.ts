export type UserRole = 'adopter' | 'guardian';
export type GuardianType = 'individual' | 'ngo';
export type PetSpecies = 'dog' | 'cat';
export type PetSize = 'small' | 'medium' | 'large';
export type PetAgeCategory = 'puppy' | 'young' | 'adult' | 'senior';
export type PetEnergyLevel = 'calm' | 'moderate' | 'high';
export type PetCompatibility = 'yes' | 'no' | 'unknown';
export type PetSex = 'male' | 'female';
export type PetAdoptionStatus = 'available' | 'in_process' | 'adopted';
export type ApplicationStatus = 'pending' | 'under_review' | 'approved' | 'rejected' | 'completed';

export type HousingType = 'casa' | 'apartamento' | 'sitio_chacara' | 'outro';
export type SpeciesPreference = 'dog' | 'cat' | 'both';
export type SizePreference = 'small' | 'medium' | 'large' | 'any';

export interface AdopterProfile {
  id: string;
  role: 'adopter';
  name: string;
  cpf: string;
  rg?: string;
  birthDate: string;
  primaryPhone: string;
  secondaryPhone?: string;
  email: string;
  profession?: string;
  socialMedia?: string;
  avatar?: string | null;

  // Novos campos relevantes para o processo de adoção
  city?: string;
  state?: string;
  housingType?: HousingType;
  hasAdequateSpace?: boolean;
  hasOtherPets?: boolean;
  otherPetsDetails?: string;
  hasChildren?: boolean;
  speciesPreference?: SpeciesPreference;
  sizePreference?: SizePreference;
  bio?: string;
}

export interface GuardianProfile {
  id: string;
  role: 'guardian';
  guardianType: GuardianType;
  name: string; // Nome do Protetor ou da ONG
  responsibleName?: string;
  document: string; // CPF ou CNPJ
  email: string;
  primaryPhone: string;
  city: string;
  state: string;
  neighborhood: string;
  description?: string;
  bio?: string;
  socialMedia?: string;
  verified?: boolean;
  avatar?: string | null;
}

export type CurrentUser = AdopterProfile | GuardianProfile;

export interface Pet {
  id: string;
  name: string;
  species: PetSpecies;
  breed: string;
  size: PetSize;
  approximateAge: string;
  ageCategory: PetAgeCategory;
  energyLevel: PetEnergyLevel;
  compatibleWithChildren: PetCompatibility;
  compatibleWithDogs: PetCompatibility;
  compatibleWithCats: PetCompatibility;
  sex: PetSex;
  status: PetAdoptionStatus;
  vaccinated: boolean;
  castrated: boolean;
  dewormed: boolean;
  vaccinationDetails?: string;
  specialNeeds?: string;
  photos: string[];
  headline: string;
  story: string;
  temperament: string[];
  temperamentDescription: string;
  guardianId: string;
  guardianName: string;
  guardianType: GuardianType;
  guardianPhone: string;
  guardianEmail: string;
  location: {
    city: string;
    state: string;
    neighborhood: string;
  };
  createdAt: string;
}

export interface CurrentPetDetail {
  species: string;
  age: string;
  sex: string;
  castrated: boolean;
  vaccinated: boolean;
}

export interface ApplicationMessage {
  id: string;
  senderName: string;
  senderRole: 'adopter' | 'guardian' | 'system';
  content: string;
  sentAt: string;
}

export interface PreAdoptionApplication {
  id: string;
  petId: string;
  petName: string;
  petPhoto: string;
  petSpecies: PetSpecies;
  guardianId: string;
  guardianName: string;
  guardianType: GuardianType;
  candidateId: string;
  candidate: {
    name: string;
    birthDate: string;
    profession: string;
    primaryPhone?: string;
    email: string;
    socialMedia: string;
    cpf?: string;
    rg?: string;
  };
  // 1. Habitação
  housingType: 'casa' | 'apartamento' | 'sobrado' | 'sitio';
  housingStatus: 'proprio' | 'alugado';
  landlordPermission?: boolean;
  hasProtection: boolean; // Telas ou muros
  protectionDetails?: string;
  accessArea: 'livre_total' | 'area_especifica';
  // 2. Família e Rotina
  adultsCount: number;
  childrenCount: number;
  familyAgreement: boolean;
  allergyCases: boolean;
  allergyDetails?: string;
  hoursAlone: number;
  dailyCarePlan: string;
  travelCarePlan: string;
  // 3. Pets e Finanças
  hasCurrentPets: boolean;
  currentPetsDescription?: string;
  currentPetsDetails?: CurrentPetDetail[];
  previousPetsHistory: string;
  costAwareness: boolean;
  // Status e Notas
  status: ApplicationStatus;
  createdAt: string;
  notes: string[];
  guardianNotes?: string;
  messages: ApplicationMessage[];
  // Análise Automática de Compatibilidade
  automatedAnalysis?: {
    suitabilityScore: number;
    verdict: string;
    strengths: string[];
    attentionPoints: string[];
    suggestedQuestions: string[];
    resumo?: string;
    justificativa?: string;
    origem?: 'local' | 'ia';
    versao?: string;
    geradoEm?: string;
    provedor?: string;
    modelo?: string;
    fatores?: Array<{
      criterio: string;
      impacto: number;
      explicacao: string;
    }>;
  };
}

export interface SmartMatchQuizData {
  preferredSpecies: 'all' | 'dog' | 'cat';
  preferredSize: 'all' | 'small' | 'medium' | 'large';
  preferredAge: 'all' | PetAgeCategory;
  preferredEnergy: 'all' | PetEnergyLevel;
  hasChildren: boolean;
  residentPets: 'none' | 'dog' | 'cat' | 'both';
  acceptsSpecialNeeds: boolean;
  /** Campos legados aceitos apenas pelo fallback local de registros antigos. */
  housingType?: 'casa' | 'apartamento' | 'sobrado' | 'sitio';
  hasProtection?: boolean;
  hoursAlone?: number;
  hasOtherPets?: boolean;
  energyLevel?: 'calm' | 'moderate' | 'high';
  activityAvailability?: 'low' | 'moderate' | 'high';
  experienceLevel?: 'first_pet' | 'some_experience' | 'experienced';
  financialPreparedness?: 'planned' | 'partial' | 'not_planned';
  absenceCarePlan?: 'defined' | 'support_network' | 'not_defined';
  willingToAdaptHome?: boolean;
  hasAllergies?: boolean;
}

export interface MatchResult {
  pet: Pet;
  score: number; // 0 to 100
  compatibilityLevel: 'high' | 'medium' | 'moderate';
  matchedReasons: string[];
  adaptationTips: string[];
  resumoIa?: string;
  motivosIa?: string[];
  cuidadosIa?: string[];
  origemAnalise?: 'local' | 'ia';
}
