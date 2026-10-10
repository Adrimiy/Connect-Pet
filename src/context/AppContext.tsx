"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import {
  Pet,
  CurrentUser,
  AdopterProfile,
  PreAdoptionApplication,
  ApplicationStatus,
  SmartMatchQuizData,
  MatchResult,
  GuardianType,
  HousingType,
  SpeciesPreference,
  SizePreference
} from '../types';
import { mockPets as initialMockPets, demoAdopter } from '../data/mockPets';
import { createClient } from '@/lib/client';
import { removerFotosDoStorage } from '@/lib/petPhotos';
import type { AuthFeature, AuthPromptState } from '@/components/auth/auth-features';

export interface ToastItem {
  id: string;
  title: string;
  message?: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export type ThemeMode = 'light' | 'dark' | 'system';

interface AppContextType {
  // Theme
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;

  // Current User
  currentUser: CurrentUser | null;
  setCurrentUser: (user: CurrentUser | null) => void;
  updateUserProfile: (updates: Partial<CurrentUser> & { avatar?: string | null }) => Promise<void>;
  switchUser: (role: 'adopter' | 'guardian') => void;
  logout: () => void | Promise<void>;

  // Controle de acesso: retorna true se autenticado; caso contrário abre o modal de acesso restrito
  requireAuth: (feature?: AuthFeature, options?: { redirectTo?: string }) => boolean;
  authPrompt: AuthPromptState | null;
  closeAuthPrompt: () => void;

  // Pets
  pets: Pet[];
  addPet: (pet: Omit<Pet, 'id' | 'createdAt'>) => void;
  updatePet: (id: string, updates: Partial<Pet>) => void;
  deletePet: (id: string) => void;

  // Favorites
  favorites: string[];
  toggleFavorite: (petId: string) => void;
  isFavorite: (petId: string) => boolean;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: React.Dispatch<React.SetStateAction<boolean>>;

  // Applications
  applications: PreAdoptionApplication[];
  submitApplication: (applicationData: Omit<PreAdoptionApplication, 'id' | 'createdAt' | 'status' | 'notes' | 'messages' | 'automatedAnalysis'>) => PreAdoptionApplication;
  updateApplicationStatus: (appId: string, status: ApplicationStatus) => void;
  updateGuardianNotes: (appId: string, notes: string) => void;
  sendApplicationMessage: (appId: string, content: string) => void;

  // Toasts
  toasts: ToastItem[];
  showToast: (title: string, message?: string, type?: 'success' | 'error' | 'warning' | 'info') => void;
  removeToast: (id: string) => void;

  // Deterministic Algorithms & Rules
  calculateAge: (birthDate: string) => number;
  isAgeAllowed: (birthDate: string) => boolean;
  analyzeDossier: (app: Partial<PreAdoptionApplication>) => NonNullable<PreAdoptionApplication['automatedAnalysis']>;
  calculateSmartMatch: (quiz: SmartMatchQuizData, pet: Pet) => MatchResult;
}

const STORAGE_KEYS = {
  PETS: 'acolher_pets_v2',
  APPLICATIONS: 'acolher_applications_v1',
  USER: 'acolher_user_v1',
  FAVORITES: 'acolher_favorites_v1',
  THEME: 'acolher_theme_mode_v1',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function normalizePet(raw: unknown): Pet {
  const rawObj = (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}) as Record<string, unknown>;
  const photos = Array.isArray(rawObj.photos) && rawObj.photos.length > 0
    ? (rawObj.photos as string[])
    : Array.isArray(rawObj.images) && rawObj.images.length > 0
      ? (rawObj.images as string[])
      : ["https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1000&auto=format&fit=crop"];

  let location = { city: "São Paulo", state: "SP", neighborhood: "Vila Mariana" };
  const rawLoc = rawObj.location;
  if (rawLoc && typeof rawLoc === "object") {
    const locObj = rawLoc as Record<string, string>;
    location = {
      city: locObj.city || "São Paulo",
      state: locObj.state || "SP",
      neighborhood: locObj.neighborhood || "Vila Mariana"
    };
  } else if (typeof rawLoc === "string") {
    const parts = rawLoc.split(",").map((s: string) => s.trim());
    location = {
      city: parts[0] || "São Paulo",
      state: parts[1] || "SP",
      neighborhood: "Vila Mariana"
    };
  }

  let temperament: string[] = ["Dócil", "Sociável"];
  if (Array.isArray(rawObj.temperament)) {
    temperament = rawObj.temperament as string[];
  } else if (typeof rawObj.temperament === "string") {
    temperament = rawObj.temperament.split(",").map((s: string) => s.trim()).filter(Boolean);
  }

  return {
    id: String(rawObj.id || `pet-${Date.now()}`),
    name: String(rawObj.name || "Sem Nome"),
    species: rawObj.species === "cat" || rawObj.species === "Gato" ? "cat" : "dog",
    breed: String(rawObj.breed || "Vira-lata (SRD)"),
    size: rawObj.size === "small" || rawObj.size === "Pequeno" ? "small" : rawObj.size === "large" || rawObj.size === "Grande" ? "large" : "medium",
    approximateAge: String(rawObj.approximateAge || rawObj.age || "1 ano"),
    ageCategory: (rawObj.ageCategory as Pet['ageCategory']) || "young",
    sex: rawObj.sex === "female" || rawObj.gender === "Fêmea" ? "female" : "male",
    status: rawObj.status === "adopted" || rawObj.status === "Adotado" ? "adopted" : rawObj.status === "in_process" || rawObj.status === "Em processo" ? "in_process" : "available",
    vaccinated: !!rawObj.vaccinated,
    castrated: !!rawObj.castrated,
    dewormed: rawObj.dewormed !== undefined ? !!rawObj.dewormed : true,
    vaccinationDetails: String(rawObj.vaccinationDetails || "Vacinação em dia."),
    specialNeeds: String(rawObj.specialNeeds || ""),
    photos,
    headline: String(rawObj.headline || "Pronto para um novo lar cheio de carinho."),
    story: String(rawObj.story || rawObj.history || "Resgatado com carinho, aguarda uma família amorosa e responsável."),
    temperament: temperament.length > 0 ? temperament : ["Dócil"],
    temperamentDescription: String(rawObj.temperamentDescription || "Muito dócil, companheiro e educado."),
    guardianId: String(rawObj.guardianId || "guardian-1"),
    guardianName: String(rawObj.guardianName || (rawObj.isOng ? "ONG Patinhas com Amor" : "Protetor Independente")),
    guardianType: (rawObj.guardianType as Pet['guardianType']) || (rawObj.isOng ? "ngo" : "individual"),
    guardianPhone: String(rawObj.guardianPhone || "(11) 97123-9988"),
    guardianEmail: String(rawObj.guardianEmail || "contato@patinhascomamor.org.br"),
    location,
    createdAt: String(rawObj.createdAt || new Date().toISOString())
  };
}

function cleanAvatar(val: unknown): string | undefined {
  if (typeof val === 'string' && val.trim().length > 0 && val !== 'null' && val !== 'undefined') {
    return val.trim();
  }
  return undefined;
}

async function fetchUserProfile(supabaseClient: ReturnType<typeof createClient>, sessionUser: SupabaseUser): Promise<CurrentUser> {
  const meta = (sessionUser.user_metadata || {}) as Record<string, unknown>;
  const isGuardian = meta.role === 'guardian';

  // Se houver resquício de avatar em base64 no metadata do Auth, limpa em background para diminuir os cookies JWT
  if (typeof meta.avatar === 'string' && meta.avatar.startsWith('data:')) {
    supabaseClient.auth.updateUser({ data: { avatar: null } }).catch(() => {});
  }

  try {
    const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('*')
      .eq('id', sessionUser.id)
      .maybeSingle();

    if (!error && profile) {
      // Se profile.avatar foi explicitamente setado como null ou vazio, a foto foi removida do cadastro
      const resolvedAvatar = (profile.avatar === null || profile.avatar === '')
        ? undefined
        : (cleanAvatar(profile.avatar) || cleanAvatar(meta.avatar));

      if (profile.role === 'guardian') {
        return {
          id: profile.id,
          role: 'guardian',
          guardianType: profile.guardian_type || 'ngo',
          name: profile.name || 'ONG Patinhas',
          responsibleName: profile.responsible_name || undefined,
          document: profile.document || '',
          email: profile.email || sessionUser.email || '',
          primaryPhone: profile.primary_phone || '',
          city: profile.city || 'São Paulo',
          state: profile.state || 'SP',
          neighborhood: profile.neighborhood || 'Centro',
          description: profile.description || undefined,
          bio: profile.bio || undefined,
          verified: profile.verified ?? false,
          avatar: resolvedAvatar
        };
      } else {
        return {
          id: profile.id,
          role: 'adopter',
          name: profile.name || 'Adotante',
          cpf: profile.cpf || '',
          rg: profile.rg || '',
          birthDate: profile.birth_date || '2000-01-01',
          primaryPhone: profile.primary_phone || '',
          secondaryPhone: profile.secondary_phone || undefined,
          email: profile.email || sessionUser.email || '',
          profession: profile.profession || undefined,
          socialMedia: profile.social_media || undefined,
          avatar: resolvedAvatar,
          city: profile.city || (meta.city as string | undefined) || '',
          state: profile.state || (meta.state as string | undefined) || '',
          housingType: (profile.housing_type as HousingType) || (meta.housingType as HousingType | undefined),
          hasAdequateSpace: profile.has_adequate_space ?? (meta.hasAdequateSpace as boolean | undefined),
          hasOtherPets: profile.has_other_pets ?? (meta.hasOtherPets as boolean | undefined),
          otherPetsDetails: profile.other_pets_details || (meta.otherPetsDetails as string | undefined),
          hasChildren: profile.has_children ?? (meta.hasChildren as boolean | undefined),
          speciesPreference: (profile.species_preference as SpeciesPreference) || (meta.speciesPreference as SpeciesPreference | undefined),
          sizePreference: (profile.size_preference as SizePreference) || (meta.sizePreference as SizePreference | undefined),
          bio: profile.bio || (meta.bio as string | undefined)
        };
      }
    }
  } catch (err) {
    console.warn('Profile query error:', err);
  }

  // Fallback seguro extraído de sessionUser.user_metadata (gravado durante o signUp)
  if (isGuardian) {
    return {
      id: sessionUser.id,
      role: 'guardian',
      guardianType: (meta.guardianType as GuardianType) || 'ngo',
      name: String(meta.name || sessionUser.email?.split('@')[0] || 'ONG Patinhas'),
      responsibleName: meta.responsibleName ? String(meta.responsibleName) : undefined,
      document: String(meta.document || ''),
      email: sessionUser.email || '',
      primaryPhone: String(meta.primaryPhone || ''),
      city: String(meta.city || 'São Paulo'),
      state: String(meta.state || 'SP'),
      neighborhood: String(meta.neighborhood || 'Centro'),
      description: meta.description ? String(meta.description) : undefined,
      bio: meta.bio ? String(meta.bio) : undefined,
      socialMedia: meta.socialMedia ? String(meta.socialMedia) : undefined,
      verified: !!meta.verified,
      avatar: cleanAvatar(meta.avatar)
    };
  }

  return {
    id: sessionUser.id,
    role: 'adopter',
    name: String(meta.name || sessionUser.email?.split('@')[0] || 'Adotante'),
    cpf: String(meta.cpf || ''),
    rg: String(meta.rg || ''),
    birthDate: String(meta.birthDate || '2000-01-01'),
    primaryPhone: String(meta.primaryPhone || ''),
    secondaryPhone: meta.secondaryPhone ? String(meta.secondaryPhone) : undefined,
    email: sessionUser.email || '',
    profession: meta.profession ? String(meta.profession) : undefined,
    socialMedia: meta.socialMedia ? String(meta.socialMedia) : undefined,
    avatar: cleanAvatar(meta.avatar),
    city: String(meta.city || ''),
    state: String(meta.state || ''),
    housingType: (meta.housingType as HousingType | undefined),
    hasAdequateSpace: (meta.hasAdequateSpace as boolean | undefined),
    hasOtherPets: (meta.hasOtherPets as boolean | undefined),
    otherPetsDetails: meta.otherPetsDetails ? String(meta.otherPetsDetails) : undefined,
    hasChildren: (meta.hasChildren as boolean | undefined),
    speciesPreference: (meta.speciesPreference as SpeciesPreference | undefined),
    sizePreference: (meta.sizePreference as SizePreference | undefined),
    bio: meta.bio ? String(meta.bio) : undefined
  };
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  // 1. Theme State
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode | null;
        if (savedTheme) return savedTheme;
      } catch { }
    }
    return 'system';
  });

  // 2. User State - Inicia estritamente nulo se não houver sessão salva
  const [currentUser, setCurrentUserState] = useState<CurrentUser | null>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
        if (savedUser) return JSON.parse(savedUser);
      } catch { }
    }
    return null;
  });

  // 3. Pets State
  const [pets, setPetsState] = useState<Pet[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('acolher_pets_v1');
        const savedPets = localStorage.getItem(STORAGE_KEYS.PETS);
        if (savedPets) {
          const parsed = JSON.parse(savedPets);
          if (Array.isArray(parsed)) {
            return parsed
              .filter((p) => p && p.id !== '0ea90e62-d729-4900-bfd7-e5762fe1c9b6' && p.id !== 'pet-7' && p.name !== 'Nina')
              .map(normalizePet);
          }
        }
      } catch { }
    }
    return initialMockPets
      .filter((p) => p.name !== 'Nina' && p.id !== '0ea90e62-d729-4900-bfd7-e5762fe1c9b6' && p.id !== 'pet-7')
      .map(normalizePet);
  });

  // 4. Favorites State - Isolado por usuário
  const [favorites, setFavoritesState] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // 5. Applications State - Inicia vazio (sem mocks fictícios)
  const [applications, setApplicationsState] = useState<PreAdoptionApplication[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedApps = localStorage.getItem(STORAGE_KEYS.APPLICATIONS);
        if (savedApps) return JSON.parse(savedApps);
      } catch { }
    }
    return [];
  });

  // 6. Toasts State
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // 7. Prompt de acesso restrito (modal global)
  const [authPrompt, setAuthPrompt] = useState<AuthPromptState | null>(null);

  // Theme synchronization with HTML .dark class
  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && mediaQuery.matches);
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    const listener = () => {
      if (theme === 'system') applyTheme();
    };

    mediaQuery.addEventListener('change', listener);
    return () => mediaQuery.removeEventListener('change', listener);
  }, [theme]);

  // Supabase Client
  const supabase = useMemo(() => {
    try {
      if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
        return createClient();
      }
    } catch (err) {
      console.warn('Could not initialize Supabase client:', err);
    }
    return null;
  }, []);

  // Derive valid favorites: only keep IDs that actually exist in the current pets catalogue and if user is logged in
  const validFavorites = useMemo(() => {
    if (!currentUser) return [];
    if (!pets || pets.length === 0) {
      return favorites.filter((id) => !id.startsWith('pet-'));
    }
    const petIdSet = new Set(pets.map((p) => p.id));
    return favorites.filter((id) => petIdSet.has(id));
  }, [currentUser, favorites, pets]);

  // Sincronização e escuta da sessão real do Supabase Auth
  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    async function handleUserSession(sessionUser: SupabaseUser | null) {
      if (!sessionUser) {
        if (isMounted) {
          // Permite que contas mockadas/teste persistam no localStorage
          try {
            const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
            if (savedUser) {
              const parsed = JSON.parse(savedUser);
              if (
                parsed &&
                (parsed.id?.startsWith("guardian-") ||
                  parsed.id?.startsWith("adopter-") ||
                  parsed.id?.startsWith("mock-"))
              ) {
                setCurrentUserState(parsed);
                return;
              }
            }
          } catch { }

          setCurrentUserState(null);
          setFavoritesState([]);
          try {
            localStorage.removeItem(STORAGE_KEYS.USER);
          } catch { }
        }
        return;
      }

      const profile = await fetchUserProfile(supabase!, sessionUser);
      if (!isMounted) return;

      setCurrentUserState(profile);
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(profile));
      } catch { }

      // Buscar favoritos reais do usuário autenticado no Supabase
      try {
        const { data: favData, error: favErr } = await supabase!
          .from('favorites')
          .select('pet_id')
          .eq('user_id', sessionUser.id);

        if (!favErr && Array.isArray(favData) && isMounted) {
          const ids = favData.map((f: { pet_id: string }) => f.pet_id);
          setFavoritesState(ids);
          try {
            localStorage.setItem(`acolher_favorites_${sessionUser.id}`, JSON.stringify(ids));
          } catch { }
        } else {
          try {
            const cached = localStorage.getItem(`acolher_favorites_${sessionUser.id}`);
            if (cached && isMounted) {
              setFavoritesState(JSON.parse(cached));
            }
          } catch { }
        }
      } catch (err) {
        console.warn('Supabase favorites fetch warning:', err);
      }
    }

    // 1. Verificar sessão ativa no carregamento inicial / F5
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!isMounted) return;
      if (session?.user) {
        handleUserSession(session.user);
      } else {
        handleUserSession(null);
      }
    });

    // 2. Escutar mudanças em tempo real (LOGIN, LOGOUT, REFRESH_TOKEN)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          await handleUserSession(session.user);
        }
      } else if (event === 'SIGNED_OUT') {
        await handleUserSession(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Fetch Pets and Applications from Supabase on mount
  useEffect(() => {
    if (!supabase) return;

    let isMounted = true;

    async function syncFromSupabase() {
      try {
        // 1. Fetch Pets
        const { data: remotePets, error: petsError } = await supabase!
          .from('pets')
          .select('*')
          .order('created_at', { ascending: false });

        if (!petsError && Array.isArray(remotePets) && remotePets.length > 0 && isMounted) {
          const mappedPets = remotePets.map((p: Record<string, unknown>) =>
            normalizePet({
              id: p.id,
              name: p.name,
              species: p.species,
              breed: p.breed,
              size: p.size,
              approximateAge: p.approximate_age,
              ageCategory: p.age_category,
              sex: p.sex,
              status: p.status,
              vaccinated: p.vaccinated,
              castrated: p.castrated,
              dewormed: p.dewormed,
              vaccinationDetails: p.vaccination_details,
              specialNeeds: p.special_needs,
              photos: p.photos,
              headline: p.headline,
              story: p.story,
              temperament: p.temperament,
              temperamentDescription: p.temperament_description,
              guardianId: p.guardian_id,
              guardianName: p.guardian_name,
              guardianType: p.guardian_type,
              guardianPhone: p.guardian_phone,
              guardianEmail: p.guardian_email,
              location: {
                city: p.city || 'São Paulo',
                state: p.state || 'SP',
                neighborhood: p.neighborhood || 'Vila Mariana'
              },
              createdAt: p.created_at
            })
          );

          // Mantém pets criados apenas localmente (cadastro não aceito pelo banco) para não sumirem ao recarregar
          setPetsState((prev) => {
            const remoteIds = new Set(mappedPets.map((p) => p.id));
            const locais = prev.filter((p) => /^pet-\d{13}$/.test(p.id) && !remoteIds.has(p.id));
            const merged = [...locais, ...mappedPets];
            try {
              localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(merged));
            } catch { }
            return merged;
          });
        }

        // 2. Fetch Applications with joined pets and messages
        const { data: remoteApps, error: appsError } = await supabase!
          .from('applications')
          .select('*, pets(id, name, photos, species), application_messages(*)')
          .order('created_at', { ascending: false });

        if (!appsError && Array.isArray(remoteApps) && remoteApps.length > 0 && isMounted) {
          const mappedApps: PreAdoptionApplication[] = remoteApps.map((a: Record<string, unknown>) => {
            const candidate = (a.candidate || {}) as Record<string, string>;
            const housing = (a.housing || {}) as Record<string, unknown>;
            const routine = (a.routine || {}) as Record<string, unknown>;
            const finance = (a.finance || {}) as Record<string, unknown>;
            const dossier = (a.dossier || {}) as Record<string, unknown>;

            const petObj = (a.pets && typeof a.pets === 'object' ? a.pets : null) as Record<string, unknown> | null;
            const petPhotos = petObj && Array.isArray(petObj.photos) ? (petObj.photos as string[]) : [];
            const petPhoto = petPhotos[0] || String(a.pet_photo || 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?q=80&w=1000&auto=format&fit=crop');
            const petName = petObj?.name ? String(petObj.name) : String(a.pet_name || 'Pet');
            const petSpecies = (petObj?.species || a.pet_species || 'dog') as Pet['species'];

            const rawMessages = Array.isArray(a.application_messages) && a.application_messages.length > 0
              ? [...a.application_messages]
                .sort((m1: Record<string, unknown>, m2: Record<string, unknown>) =>
                  new Date(String(m1.created_at || 0)).getTime() - new Date(String(m2.created_at || 0)).getTime()
                )
                .map((m: Record<string, unknown>) => ({
                  id: String(m.id),
                  senderName: String(m.sender_name || 'Usuário'),
                  senderRole: (m.sender_role === 'candidate' ? 'adopter' : m.sender_role) as 'adopter' | 'guardian' | 'system',
                  content: String(m.message || ''),
                  sentAt: String(m.created_at || new Date().toISOString())
                }))
              : Array.isArray(a.messages)
                ? (a.messages as PreAdoptionApplication['messages'])
                : [
                  {
                    id: `msg-${a.id}`,
                    senderName: String(candidate.name || a.candidate_name || 'Candidato'),
                    senderRole: 'adopter' as const,
                    content: 'Candidatura enviada.',
                    sentAt: String(a.created_at || new Date().toISOString())
                  }
                ];

            return {
              id: String(a.id),
              petId: String(a.pet_id || ''),
              petName,
              petPhoto,
              petSpecies,
              guardianId: String(a.guardian_id || 'guardian-1'),
              guardianName: String(a.guardian_name || 'ONG Patinhas com Amor'),
              guardianType: (a.guardian_type as Pet['guardianType']) || 'ngo',
              candidateId: String(a.candidate_id || candidate.id || 'candidate-1'),
              candidate: {
                name: candidate.name || String(a.candidate_name || 'Candidato'),
                birthDate: candidate.birthDate || '2000-01-01',
                profession: candidate.profession || 'Não informado',
                primaryPhone: candidate.primaryPhone || candidate.phone || String(a.candidate_phone || ''),
                email: candidate.email || String(a.candidate_email || ''),
                socialMedia: candidate.socialMedia || '',
                cpf: candidate.cpf || '000.000.000-00',
                rg: candidate.rg || '00.000.000-0'
              },
              housingType: (housing.housingType as PreAdoptionApplication['housingType']) || 'casa',
              housingStatus: (housing.housingStatus as PreAdoptionApplication['housingStatus']) || 'proprio',
              landlordPermission: housing.landlordPermission !== undefined ? !!housing.landlordPermission : true,
              hasProtection: housing.hasProtection !== undefined ? !!housing.hasProtection : true,
              protectionDetails: String(housing.protectionDetails || ''),
              accessArea: (housing.accessArea as PreAdoptionApplication['accessArea']) || 'livre_total',
              adultsCount: typeof routine.adultsCount === 'number' ? routine.adultsCount : 2,
              childrenCount: typeof routine.childrenCount === 'number' ? routine.childrenCount : 0,
              familyAgreement: routine.familyAgreement !== undefined ? !!routine.familyAgreement : true,
              allergyCases: !!routine.allergyCases,
              allergyDetails: String(routine.allergyDetails || ''),
              hoursAlone: typeof routine.hoursAlone === 'number' ? routine.hoursAlone : 4,
              travelCarePlan: String(routine.travelCarePlan || 'Hotelzinho ou parente'),
              hasCurrentPets: !!routine.hasCurrentPets,
              currentPetsDetails: Array.isArray(routine.currentPetsDetails) ? (routine.currentPetsDetails as PreAdoptionApplication['currentPetsDetails']) : undefined,
              previousPetsHistory: String(routine.previousPetsHistory || 'Histórico de cuidados responsável.'),
              costAwareness: finance.costAwareness !== undefined ? !!finance.costAwareness : true,
              status: (a.status as ApplicationStatus) || 'pending',
              createdAt: String(a.created_at || new Date().toISOString()),
              notes: Array.isArray(a.notes) ? (a.notes as string[]) : ['Candidatura registrada.'],
              guardianNotes: String(a.guardian_notes || ''),
              messages: rawMessages,
              automatedAnalysis: (dossier.automatedAnalysis || a.automated_analysis || {
                suitabilityScore: 85,
                verdict: 'Recomendada',
                strengths: ['Dossiê completo'],
                attentionPoints: [],
                suggestedQuestions: []
              }) as NonNullable<PreAdoptionApplication['automatedAnalysis']>
            };
          });

          setApplicationsState((prev) => {
            const remoteIds = new Set(mappedApps.map((a) => a.id));
            const filteredPrev = prev.filter((a) => !remoteIds.has(a.id) && !a.id.startsWith('app-'));
            const merged = [...mappedApps, ...filteredPrev];
            try {
              localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(merged));
            } catch { }
            return merged;
          });
        }
      } catch (err) {
        console.warn('Sync from Supabase skipped or failed:', err);
      }
    }

    syncFromSupabase();

    return () => {
      isMounted = false;
    };
  }, [supabase]);

  // Set Theme with persistence
  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
    } catch { }
  }, []);

  // Set Current User with persistence
  const setCurrentUser = useCallback((user: CurrentUser | null) => {
    setCurrentUserState(user);
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEYS.USER);
      }
    } catch { }
  }, []);

  // Toasts
  const lastToastRef = useRef<{ key: string; time: number } | null>(null);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((title: string, message?: string, type: 'success' | 'error' | 'warning' | 'info' = 'info') => {
    const key = `${title}::${message || ''}`;
    const now = Date.now();

    // Evita disparos duplicados idênticos em menos de 600ms (ex: React StrictMode ou duplo clique)
    if (lastToastRef.current && lastToastRef.current.key === key && (now - lastToastRef.current.time) < 600) {
      return;
    }
    lastToastRef.current = { key, time: now };

    const id = `toast-${now}-${Math.random().toString(36).slice(2, 7)}`;
    const newToast: ToastItem = { id, title, message, type };
    setToasts((prev) => [...prev, newToast]);

    setTimeout(() => {
      removeToast(id);
    }, 4500);
  }, [removeToast]);

  // Alternar rapidamente para usuário mock de demonstração
  const switchUser = useCallback((role: 'adopter' | 'guardian' = 'guardian') => {
    const userToSet: CurrentUser = role === 'guardian' ? {
      id: 'guardian-esperanca-1',
      role: 'guardian',
      guardianType: 'ngo',
      name: 'ONG Esperança Animal',
      responsibleName: 'Dra. Helena Silveira',
      document: '32.184.902/0001-45',
      email: 'contato@ongesperanca.org.br',
      primaryPhone: '(11) 97123-9988',
      city: 'São Paulo',
      state: 'SP',
      neighborhood: 'Vila Mariana',
      description: 'Instituição sem fins lucrativos dedicada ao acolhimento e proteção de animais.',
      bio: 'Trabalhando pelo bem-estar animal com amor e transparência.',
      verified: true,
      avatar: undefined
    } : demoAdopter;

    setCurrentUserState(userToSet);
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userToSet));
    } catch { }
    showToast('Conectado como ONG', `${userToSet.name} ativa com dados mockados.`, 'success');
  }, [showToast]);

  const logout = useCallback(async () => {
    if (supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase signOut error:', err);
      }
    }
    setCurrentUserState(null);
    setFavoritesState([]);
    try {
      localStorage.removeItem(STORAGE_KEYS.USER);
      localStorage.removeItem(STORAGE_KEYS.FAVORITES);
    } catch { }
    showToast('Sessão encerrada', 'Você saiu da sua conta com sucesso.', 'info');
  }, [supabase, showToast]);

  // Atualizar perfil do usuário com sincronização no Supabase e persistência local
  const updateUserProfile = useCallback(async (updates: Partial<CurrentUser> & { avatar?: string | null }) => {
    if (!currentUser) return;
    const isRemovingAvatar = updates.avatar === null || updates.avatar === '';
    const newAvatar = isRemovingAvatar ? undefined : (updates.avatar ?? currentUser.avatar);

    // Regra estrita: a data de nascimento só pode ser preenchida uma única vez no cadastro
    // Se o usuário atual já tiver birthDate registrado, ele não pode ser sobrescrito
    const currentBirthDate = currentUser.role === 'adopter' ? (currentUser as AdopterProfile).birthDate : undefined;
    const incomingBirthDate = 'birthDate' in updates ? (updates as { birthDate?: string }).birthDate : undefined;
    const safeBirthDate = currentBirthDate || incomingBirthDate;

    const updatedUser = {
      ...currentUser,
      ...updates,
      ...(safeBirthDate && currentUser.role === 'adopter' ? { birthDate: safeBirthDate } : {}),
      avatar: newAvatar
    } as CurrentUser;

    setCurrentUserState(updatedUser);
    try {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
    } catch { }

    if (supabase) {
      try {
        // Envia apenas metadados leves ao auth para evitar inflar o token JWT nos cookies (prevenindo erro HTTP 431)
        const safeAuthData: Record<string, unknown> = {
          name: updatedUser.name,
          role: updatedUser.role
        };
        // Apenas URLs remotas leves são gravadas em metadados do Auth, nunca Base64 (data:image/...)
        if (newAvatar && (newAvatar.startsWith("http://") || newAvatar.startsWith("https://"))) {
          safeAuthData.avatar = newAvatar;
        } else {
          safeAuthData.avatar = null;
        }

        await supabase.auth.updateUser({
          data: safeAuthData
        });

        const dbUpdates: Record<string, unknown> = {
          name: updatedUser.name,
          primary_phone: updatedUser.primaryPhone,
          avatar: newAvatar || null
        };

        if (updatedUser.role === 'adopter') {
          if (safeBirthDate) dbUpdates.birth_date = safeBirthDate;
          if (updatedUser.profession) dbUpdates.profession = updatedUser.profession;
          if (updatedUser.socialMedia !== undefined) dbUpdates.social_media = updatedUser.socialMedia;
          if (updatedUser.city !== undefined) dbUpdates.city = updatedUser.city;
          if (updatedUser.state !== undefined) dbUpdates.state = updatedUser.state;
          if (updatedUser.housingType !== undefined) dbUpdates.housing_type = updatedUser.housingType;
          if (updatedUser.hasAdequateSpace !== undefined) dbUpdates.has_adequate_space = updatedUser.hasAdequateSpace;
          if (updatedUser.hasOtherPets !== undefined) dbUpdates.has_other_pets = updatedUser.hasOtherPets;
          if (updatedUser.otherPetsDetails !== undefined) dbUpdates.other_pets_details = updatedUser.otherPetsDetails;
          if (updatedUser.hasChildren !== undefined) dbUpdates.has_children = updatedUser.hasChildren;
          if (updatedUser.speciesPreference !== undefined) dbUpdates.species_preference = updatedUser.speciesPreference;
          if (updatedUser.sizePreference !== undefined) dbUpdates.size_preference = updatedUser.sizePreference;
          if (updatedUser.bio !== undefined) dbUpdates.bio = updatedUser.bio;
        } else {
          if (updatedUser.city !== undefined) dbUpdates.city = updatedUser.city;
          if (updatedUser.state !== undefined) dbUpdates.state = updatedUser.state;
          if (updatedUser.neighborhood !== undefined) dbUpdates.neighborhood = updatedUser.neighborhood;
          if (updatedUser.responsibleName !== undefined) dbUpdates.responsible_name = updatedUser.responsibleName;
          if (updatedUser.bio !== undefined) dbUpdates.bio = updatedUser.bio;
          if (updatedUser.description !== undefined) dbUpdates.description = updatedUser.description;
          if (updatedUser.socialMedia !== undefined) dbUpdates.social_media = updatedUser.socialMedia;
        }

        await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', updatedUser.id);
      } catch (err) {
        console.warn('Supabase profile update note:', err);
      }
    }

    showToast('Perfil atualizado com sucesso!', 'Suas informações foram salvas.', 'success');
  }, [currentUser, showToast, supabase]);

  // Pets Management
  const addPet = useCallback((newPetData: Omit<Pet, 'id' | 'createdAt'>) => {
    const rawPet = {
      ...newPetData,
      id: `pet-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const newPet = normalizePet(rawPet);

    // 1. Optimistic Local Update
    setPetsState((prev) => {
      const updated = [newPet, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(updated));
      } catch { }
      return updated;
    });

    // 2. Remote Supabase Insertion
    if (supabase) {
      (async () => {
        try {
          const { data, error } = await supabase
            .from('pets')
            .insert({
              name: newPet.name,
              species: newPet.species,
              breed: newPet.breed,
              size: newPet.size,
              approximate_age: newPet.approximateAge,
              age_category: newPet.ageCategory,
              sex: newPet.sex,
              status: newPet.status,
              vaccinated: newPet.vaccinated,
              castrated: newPet.castrated,
              dewormed: newPet.dewormed,
              vaccination_details: newPet.vaccinationDetails,
              special_needs: newPet.specialNeeds,
              photos: newPet.photos,
              headline: newPet.headline,
              story: newPet.story,
              temperament: newPet.temperament,
              temperament_description: newPet.temperamentDescription,
              guardian_id: newPet.guardianId,
              guardian_name: newPet.guardianName,
              guardian_type: newPet.guardianType,
              guardian_phone: newPet.guardianPhone,
              guardian_email: newPet.guardianEmail,
              city: newPet.location.city,
              state: newPet.location.state,
              neighborhood: newPet.location.neighborhood
            })
            .select();

          if (error) {
            console.warn('Supabase pet insert failed, kept in localStorage:', error.message);
            // Evita fotos órfãs no Storage quando o cadastro não foi persistido
            await removerFotosDoStorage(supabase, newPet.photos);
            showToast(
              'Cadastro salvo só neste navegador',
              'Não foi possível gravar no banco. Entre com uma conta real de ONG/Protetor para publicar o animal de verdade.',
              'warning'
            );
          } else if (data && data[0]) {
            const created = data[0];
            setPetsState((prev) =>
              prev.map((p) => (p.id === newPet.id ? { ...p, id: created.id } : p))
            );
          }
        } catch (err) {
          console.warn('Supabase pet insert error:', err);
          await removerFotosDoStorage(supabase, newPet.photos);
        }
      })();
    }

    showToast('Animal cadastrado!', `${newPet.name} já está visível para adoção.`, 'success');
  }, [showToast, supabase]);

  const updatePet = useCallback((id: string, updates: Partial<Pet>) => {
    const fotosAnteriores = pets.find((p) => p.id === id)?.photos ?? [];

    setPetsState((prev) => {
      const updated = prev.map((p) => (p.id === id ? { ...p, ...updates } : p));
      try {
        localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(updated));
      } catch { }
      return updated;
    });

    if (supabase) {
      (async () => {
        try {
          const remoteUpdates: Record<string, unknown> = {};
          if (updates.name !== undefined) remoteUpdates.name = updates.name;
          if (updates.species !== undefined) remoteUpdates.species = updates.species;
          if (updates.breed !== undefined) remoteUpdates.breed = updates.breed;
          if (updates.size !== undefined) remoteUpdates.size = updates.size;
          if (updates.approximateAge !== undefined) remoteUpdates.approximate_age = updates.approximateAge;
          if (updates.ageCategory !== undefined) remoteUpdates.age_category = updates.ageCategory;
          if (updates.sex !== undefined) remoteUpdates.sex = updates.sex;
          if (updates.status !== undefined) remoteUpdates.status = updates.status;
          if (updates.story !== undefined) remoteUpdates.story = updates.story;
          if (updates.headline !== undefined) remoteUpdates.headline = updates.headline;
          if (updates.temperament !== undefined) remoteUpdates.temperament = updates.temperament;
          if (updates.temperamentDescription !== undefined) remoteUpdates.temperament_description = updates.temperamentDescription;
          if (updates.vaccinationDetails !== undefined) remoteUpdates.vaccination_details = updates.vaccinationDetails;
          if (updates.specialNeeds !== undefined) remoteUpdates.special_needs = updates.specialNeeds;
          if (updates.photos !== undefined) remoteUpdates.photos = updates.photos;
          if (updates.vaccinated !== undefined) remoteUpdates.vaccinated = updates.vaccinated;
          if (updates.castrated !== undefined) remoteUpdates.castrated = updates.castrated;
          if (updates.dewormed !== undefined) remoteUpdates.dewormed = updates.dewormed;

          if (Object.keys(remoteUpdates).length > 0) {
            const { error } = await supabase
              .from('pets')
              .update(remoteUpdates)
              .eq('id', id);
            if (error) console.warn('Supabase pet update failed:', error.message);

            if (updates.photos !== undefined) {
              const novas = updates.photos;
              // Sucesso: remove do Storage as fotos que saíram. Falha: descarta as recém-enviadas.
              const descartar = error
                ? novas.filter((url) => !fotosAnteriores.includes(url))
                : fotosAnteriores.filter((url) => !novas.includes(url));
              await removerFotosDoStorage(supabase, descartar);
            }
          }
        } catch (err) {
          console.warn('Supabase pet update error:', err);
        }
      })();
    }

    showToast('Pet atualizado', 'As alterações foram salvas com sucesso.', 'success');
  }, [pets, showToast, supabase]);

  const deletePet = useCallback((id: string) => {
    const petToDelete = pets.find((p) => p.id === id);
    const petName = petToDelete?.name || 'O animal';
    const updated = pets.filter((p) => p.id !== id);

    setPetsState(updated);
    try {
      localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(updated));
    } catch { }

    showToast('Pet removido', `${petName} foi removido do catálogo.`, 'info');

    if (supabase) {
      (async () => {
        try {
          const { error } = await supabase.from('pets').delete().eq('id', id);
          if (error) {
            console.warn('Supabase pet delete failed:', error.message);
          } else if (petToDelete) {
            await removerFotosDoStorage(supabase, petToDelete.photos);
          }
        } catch (err) {
          console.warn('Supabase pet delete error:', err);
        }
      })();
    }
  }, [pets, showToast, supabase]);

  // Controle de acesso reutilizável
  const requireAuth = useCallback((feature: AuthFeature = 'default', options?: { redirectTo?: string }) => {
    if (currentUser) return true;
    setAuthPrompt({ feature, redirectTo: options?.redirectTo });
    return false;
  }, [currentUser]);

  const closeAuthPrompt = useCallback(() => setAuthPrompt(null), []);

  // Favorites
  const toggleFavorite = useCallback(async (petId: string) => {
    if (!requireAuth('favorites')) return;
    if (!currentUser) return;

    const isCurrentlyFav = validFavorites.includes(petId);
    const updated = isCurrentlyFav
      ? validFavorites.filter((id) => id !== petId)
      : [...validFavorites, petId];

    setFavoritesState(updated);
    try {
      localStorage.setItem(`acolher_favorites_${currentUser.id}`, JSON.stringify(updated));
    } catch { }

    if (supabase) {
      try {
        if (isCurrentlyFav) {
          const { error } = await supabase
            .from('favorites')
            .delete()
            .eq('user_id', currentUser.id)
            .eq('pet_id', petId);
          if (error && error.code !== 'PGRST205') {
            console.warn('Supabase favorite delete error:', error.message);
          }
        } else {
          const { error } = await supabase
            .from('favorites')
            .insert({ user_id: currentUser.id, pet_id: petId });
          if (error && error.code !== 'PGRST205') {
            console.warn('Supabase favorite insert error:', error.message);
          }
        }
      } catch (err) {
        console.warn('Supabase favorite toggle error:', err);
      }
    }

    if (isCurrentlyFav) {
      showToast('Removido dos favoritos', undefined, 'info');
    } else {
      showToast('Adicionado aos favoritos!', 'Você pode acompanhar seus pets favoritos.', 'success');
    }
  }, [currentUser, requireAuth, validFavorites, showToast, supabase]);

  const isFavorite = useCallback((petId: string) => {
    if (!currentUser) return false;
    return validFavorites.includes(petId);
  }, [currentUser, validFavorites]);

  // Business Rule 1: Age calculation & 21+ rule
  const calculateAge = useCallback((birthDate: string): number => {
    if (!birthDate) return 0;
    const birth = new Date(birthDate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return Math.max(0, age);
  }, []);

  const isAgeAllowed = useCallback((birthDate: string): boolean => {
    return calculateAge(birthDate) >= 21;
  }, [calculateAge]);

  // Deterministic Dossier Analysis Engine
  const analyzeDossier = useCallback((app: Partial<PreAdoptionApplication>): NonNullable<PreAdoptionApplication['automatedAnalysis']> => {
    let score = 70;
    const strengths: string[] = [];
    const attentionPoints: string[] = [];
    const suggestedQuestions: string[] = [];

    // Age rule check
    if (app.candidate?.birthDate) {
      const age = calculateAge(app.candidate.birthDate);
      if (age >= 21) {
        strengths.push(`Candidato com ${age} anos (acima da idade mínima de 21 anos).`);
        score += 5;
      } else {
        attentionPoints.push(`Candidato tem apenas ${age} anos. A política exige 21 anos completos.`);
        score -= 40;
      }
    }

    // Housing security
    if (app.housingType === 'apartamento') {
      if (app.hasProtection) {
        strengths.push('Apartamento totalmente protegido com telas de segurança em janelas e sacadas.');
        score += 15;
      } else {
        attentionPoints.push('Apartamento sem telas de proteção: risco gravíssimo de queda, especialmente para felinos.');
        score -= 35;
        suggestedQuestions.push('Você tem orçamento e autorização para instalar telas de proteção antes da chegada do animal?');
      }
    } else if (app.housingType === 'casa' || app.housingType === 'sobrado') {
      if (app.hasProtection) {
        strengths.push('Casa com muros altos e sem rotas de fuga ou acesso desacompanhado à rua.');
        score += 12;
      } else {
        attentionPoints.push('Casa sem comprovação de muros altos ou portão seguro: risco de fuga para a via pública.');
        score -= 20;
        suggestedQuestions.push('Como é a altura dos muros e o sistema do portão principal para evitar escapadas?');
      }
    }

    // Housing status
    if (app.housingStatus === 'proprio') {
      strengths.push('Imóvel próprio: maior estabilidade de moradia a longo prazo.');
      score += 5;
    } else if (app.housingStatus === 'alugado') {
      if (app.landlordPermission) {
        strengths.push('Imóvel alugado com autorização explícita do proprietário para animais.');
      } else {
        attentionPoints.push('Imóvel alugado sem autorização confirmada do locador ou regimento interno.');
        score -= 15;
        suggestedQuestions.push('O contrato de locação ou convenção condominial permite animais de estimação?');
      }
    }

    // Family agreement
    if (app.familyAgreement) {
      strengths.push('Unanimidade e concordância de todos os residentes sobre a chegada do novo pet.');
      score += 10;
    } else {
      attentionPoints.push('Falta de consenso de todos os moradores da casa sobre a adoção.');
      score -= 30;
      suggestedQuestions.push('Quais membros da casa têm ressalvas e como vocês pretendem alinhar a convivência?');
    }

    // Allergies
    if (app.allergyCases) {
      attentionPoints.push(`Histórico de alergia relatado na casa: ${app.allergyDetails || 'Necessita confirmação médica'}.`);
      score -= 10;
      suggestedQuestions.push('Como a pessoa alérgica reage ao contato e qual é o plano de manejo?');
    }

    // Time alone
    const hours = app.hoursAlone ?? 4;
    if (hours <= 4) {
      strengths.push(`Excelente presença: o animal ficará sozinho apenas ${hours}h por dia.`);
      score += 10;
    } else if (hours > 8) {
      attentionPoints.push(`Animal ficará sozinho por período prolongado (${hours}h/dia). Pode desenvolver ansiedade de separação.`);
      score -= 15;
      suggestedQuestions.push('Haverá brinquedos interativos, passeadores ou visitas na hora do almoço?');
    }

    // Vacation plan
    if (app.travelCarePlan && app.travelCarePlan.trim().length > 15) {
      strengths.push('Plano estruturado e responsável de acolhimento durante viagens e férias.');
      score += 5;
    } else {
      attentionPoints.push('Plano de viagens vago ou não detalhado.');
      suggestedQuestions.push('O que você planeja fazer com o pet durante períodos de viagem prolongada?');
    }

    // Financial awareness
    if (app.costAwareness) {
      strengths.push('Consciência declarada dos custos contínuos (ração de qualidade, vacinas anuais e emergências).');
      score += 5;
    } else {
      attentionPoints.push('Não confirmou ciência dos custos e imprevistos veterinários.');
      score -= 20;
    }

    // Existing pets
    if (app.hasCurrentPets) {
      strengths.push('Já convive com outros animais de estimação.');
      suggestedQuestions.push('Como seus animais atuais reagem na aproximação de novos companheiros?');
    }

    // Final score clamp
    const finalScore = Math.min(100, Math.max(10, score));

    let verdict = 'Recomendada com Observações';
    if (finalScore >= 85) {
      verdict = 'Altamente Recomendada';
    } else if (finalScore >= 70) {
      verdict = 'Recomendada com Adaptação';
    } else if (finalScore >= 50) {
      verdict = 'Necessita Entrevista Aprofundada';
    } else {
      verdict = 'Não Recomendada (Risco de Incompatibilidade)';
    }

    return {
      suitabilityScore: finalScore,
      verdict,
      strengths,
      attentionPoints,
      suggestedQuestions: suggestedQuestions.slice(0, 3)
    };
  }, [calculateAge]);

  // Deterministic SmartMatch Algorithm
  const calculateSmartMatch = useCallback((quiz: SmartMatchQuizData, pet: Pet): MatchResult => {
    let score = 75;
    const matchedReasons: string[] = [];
    const adaptationTips: string[] = [];

    // Species preference
    if (quiz.preferredSpecies !== 'all') {
      if (pet.species === quiz.preferredSpecies) {
        score += 15;
        matchedReasons.push(`Corresponde à espécie desejada (${pet.species === 'dog' ? 'Cachorro' : 'Gato'}).`);
      } else {
        score -= 25;
      }
    }

    // Housing & Species
    if (pet.species === 'cat') {
      if (quiz.hasProtection) {
        score += 15;
        matchedReasons.push('Moradia com telas seguras: ambiente perfeito para felinos.');
      } else {
        score -= 30;
        adaptationTips.push('Instalação de telas nas janelas é requisito obrigatório antes de receber este gatinho.');
      }
    }

    // Size vs Housing
    if (pet.size === 'large') {
      if (quiz.housingType === 'apartamento') {
        score -= 10;
        adaptationTips.push('Por ser de grande porte, necessita de passeios diários regulares para gastar energia.');
      } else {
        score += 10;
        matchedReasons.push('Imóvel espaçoso ideal para cão de grande porte.');
      }
    }

    // Size preference
    if (quiz.preferredSize !== 'all') {
      if (pet.size === quiz.preferredSize) {
        score += 10;
        matchedReasons.push('Porte ideal para sua expectativa.');
      } else {
        score -= 10;
      }
    }

    // Energy & Hours alone
    if (quiz.hoursAlone > 6) {
      if (pet.ageCategory === 'senior' || pet.temperament.includes('Calma') || pet.temperament.includes('Tranquilo')) {
        score += 12;
        matchedReasons.push('Temperamento tranquilo e maduro, lida melhor com períodos de tranquilidade na casa.');
      } else if (pet.ageCategory === 'puppy') {
        score -= 20;
        adaptationTips.push('Filhotes demandam supervisão frequente e podem chorar se ficarem sozinhos por muito tempo.');
      }
    } else {
      score += 8;
      matchedReasons.push('Sua presença diária favorece uma adaptação rápida e acolhedora.');
    }

    // Children
    if (quiz.hasChildren) {
      if (pet.temperament.includes('Dócil') || pet.temperament.includes('Brincalhão') || pet.temperament.includes('Gentil')) {
        score += 12;
        matchedReasons.push('Histórico muito positivo de paciência e afeto com crianças.');
      } else {
        adaptationTips.push('Recomenda-se aproximação gradual e supervisão inicial das crianças com o pet.');
      }
    }

    // Other pets
    if (quiz.hasOtherPets) {
      if (pet.temperament.includes('Sociável') || pet.temperament.includes('Companheiro')) {
        score += 10;
        matchedReasons.push('Sociável com outros animais de estimação.');
      } else {
        adaptationTips.push('Faça uma apresentação com reforço positivo e cheiros trocados nos primeiros dias.');
      }
    }

    // Energy compatibility
    if (quiz.energyLevel === 'high' && (pet.temperament.includes('Brincalhão') || pet.size === 'large')) {
      score += 10;
      matchedReasons.push('Nível de energia alinhado com suas atividades e passeios.');
    } else if (quiz.energyLevel === 'calm' && (pet.temperament.includes('Calma') || pet.temperament.includes('Tranquila') || pet.ageCategory === 'senior')) {
      score += 12;
      matchedReasons.push('Ideal para rotinas tranquilas e momentos relaxantes.');
    }

    const finalScore = Math.min(99, Math.max(35, score));
    const level = finalScore >= 80 ? 'high' : finalScore >= 65 ? 'medium' : 'moderate';

    if (adaptationTips.length === 0) {
      adaptationTips.push('Ofereça um cantinho aconchegante com caminha e brinquedos desde o primeiro dia.');
    }

    return {
      pet,
      score: finalScore,
      compatibilityLevel: level,
      matchedReasons: matchedReasons.slice(0, 3),
      adaptationTips: adaptationTips.slice(0, 2)
    };
  }, []);

  // Applications
  const submitApplication = useCallback((data: Omit<PreAdoptionApplication, 'id' | 'createdAt' | 'status' | 'notes' | 'messages' | 'automatedAnalysis'>): PreAdoptionApplication => {
    // Garantir imutabilidade da data de nascimento no dossiê de adoção
    const userBirthDate = currentUser?.role === 'adopter' ? (currentUser as AdopterProfile).birthDate : undefined;
    const effectiveBirthDate = userBirthDate || data.candidate.birthDate;
    const sanitizedData = {
      ...data,
      candidate: {
        ...data.candidate,
        birthDate: effectiveBirthDate
      }
    };

    const analysis = analyzeDossier(sanitizedData);
    const newApp: PreAdoptionApplication = {
      ...sanitizedData,
      id: `app-${Date.now()}`,
      createdAt: new Date().toISOString(),
      status: 'pending',
      notes: ['Candidatura submetida através do ConnectPet.'],
      guardianNotes: '',
      messages: [
        {
          id: `msg-${Date.now()}`,
          senderName: data.candidate.name,
          senderRole: 'adopter',
          content: `Olá! Acabei de enviar minha candidatura para adotar ${data.petName}. Fico à disposição para conversar e agendar uma visita!`,
          sentAt: new Date().toISOString()
        }
      ],
      automatedAnalysis: analysis
    };

    setApplicationsState((prev) => {
      const updated = [newApp, ...prev];
      try {
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(updated));
      } catch { }
      return updated;
    });

    // Mark pet as in_process
    setPetsState((prev) => {
      const updated = prev.map((p) => (p.id === data.petId ? { ...p, status: 'in_process' as const } : p));
      try {
        localStorage.setItem(STORAGE_KEYS.PETS, JSON.stringify(updated));
      } catch { }
      return updated;
    });

    showToast('Candidatura enviada!', `Seu dossiê para adotar ${data.petName} foi recebido pela ONG.`, 'success');

    // Remote Supabase Application Insertion
    if (supabase) {
      (async () => {
        try {
          const { data: created, error } = await supabase
            .from('applications')
            .insert({
              pet_id: data.petId.startsWith('pet-') ? null : data.petId,
              candidate_name: data.candidate.name,
              candidate_email: data.candidate.email,
              candidate_phone: data.candidate.primaryPhone || '',
              guardian_id: data.guardianId,
              status: 'pending',
              candidate: data.candidate,
              housing: {
                housingType: data.housingType,
                housingStatus: data.housingStatus,
                landlordPermission: data.landlordPermission,
                hasProtection: data.hasProtection,
                protectionDetails: data.protectionDetails,
                accessArea: data.accessArea
              },
              routine: {
                adultsCount: data.adultsCount,
                childrenCount: data.childrenCount,
                hoursAlone: data.hoursAlone,
                familyAgreement: data.familyAgreement,
                allergyCases: data.allergyCases,
                allergyDetails: data.allergyDetails,
                travelCarePlan: data.travelCarePlan,
                hasCurrentPets: data.hasCurrentPets,
                currentPetsDetails: data.currentPetsDetails,
                previousPetsHistory: data.previousPetsHistory
              },
              finance: {
                costAwareness: data.costAwareness
              },
              dossier: {
                automatedAnalysis: analysis
              },
              automated_analysis: analysis
            })
            .select();

          if (error) {
            console.warn('Supabase application insert note:', error.message);
          } else if (created && created[0]) {
            const newAppId = created[0].id;
            setApplicationsState((prev) =>
              prev.map((app) => (app.id === newApp.id ? { ...app, id: newAppId } : app))
            );

            // Inserir mensagem inicial no Supabase
            await supabase.from('application_messages').insert({
              application_id: newAppId,
              sender_id: data.candidateId,
              sender_name: data.candidate.name,
              sender_role: 'candidate',
              message: `Olá! Acabei de enviar minha candidatura para adotar ${data.petName}. Fico à disposição para conversar e agendar uma visita!`
            });
          }
        } catch (err) {
          console.warn('Supabase app insert error:', err);
        }
      })();
    }

    return newApp;
  }, [analyzeDossier, currentUser, showToast, supabase]);

  const updateApplicationStatus = useCallback((appId: string, status: ApplicationStatus) => {
    setApplicationsState((prev) => {
      const updated = prev.map((app) => {
        if (app.id === appId) {
          const statusLabels: Record<ApplicationStatus, string> = {
            pending: 'Pendente',
            under_review: 'Em Avaliação',
            approved: 'Aprovada',
            rejected: 'Não Aprovada',
            completed: 'Adoção Concluída'
          };
          const systemMsg = {
            id: `sys-${Date.now()}`,
            senderName: 'Sistema ConnectPet',
            senderRole: 'system' as const,
            content: `Status da candidatura alterado para: ${statusLabels[status]}.`,
            sentAt: new Date().toISOString()
          };
          return {
            ...app,
            status,
            messages: [...app.messages, systemMsg]
          };
        }
        return app;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(updated));
      } catch { }
      return updated;
    });

    if (supabase && !appId.startsWith('app-')) {
      (async () => {
        try {
          const { error } = await supabase
            .from('applications')
            .update({ status })
            .eq('id', appId);
          if (error) console.warn('Supabase app status update note:', error.message);
          // A mensagem de sistema é gravada pelo trigger do banco (ver schema.sql, seção 10.5)
        } catch (err) {
          console.warn('Supabase app status update error:', err);
        }
      })();
    }

    showToast('Status atualizado', 'O andamento da candidatura foi atualizado com sucesso.', 'success');
  }, [showToast, supabase]);

  const updateGuardianNotes = useCallback((appId: string, notes: string) => {
    setApplicationsState((prev) => {
      const updated = prev.map((app) => (app.id === appId ? { ...app, guardianNotes: notes } : app));
      try {
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(updated));
      } catch { }
      return updated;
    });

    if (supabase && !appId.startsWith('app-')) {
      (async () => {
        try {
          const { error } = await supabase
            .from('applications')
            .update({ guardian_notes: notes })
            .eq('id', appId);
          if (error) console.warn('Supabase guardian notes note:', error.message);
        } catch (err) {
          console.warn('Supabase guardian notes error:', err);
        }
      })();
    }

    showToast('Nota salva', 'Anotações internas da ONG atualizadas.', 'info');
  }, [showToast, supabase]);

  const sendApplicationMessage = useCallback((appId: string, content: string) => {
    if (!content.trim()) return;

    setApplicationsState((prev) => {
      const updated = prev.map((app) => {
        if (app.id === appId) {
          const isAdopter = currentUser?.role === 'adopter';
          const senderName = currentUser?.name || (isAdopter ? 'Candidato' : 'Protetor');
          const senderRole = isAdopter ? ('adopter' as const) : ('guardian' as const);

          const newMessage = {
            id: `msg-${Date.now()}`,
            senderName,
            senderRole,
            content: content.trim(),
            sentAt: new Date().toISOString()
          };

          return {
            ...app,
            messages: [...app.messages, newMessage]
          };
        }
        return app;
      });
      try {
        localStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(updated));
      } catch { }
      return updated;
    });

    if (supabase && !appId.startsWith('app-')) {
      (async () => {
        try {
          const { error } = await supabase
            .from('application_messages')
            .insert({
              application_id: appId,
              sender_id: currentUser?.id || 'anon',
              sender_name: currentUser?.name || 'Usuário',
              sender_role: currentUser?.role === 'guardian' ? 'guardian' : 'candidate',
              message: content.trim()
            });
          if (error) console.warn('Supabase message insert note:', error.message);
        } catch (err) {
          console.warn('Supabase message error:', err);
        }
      })();
    }

    showToast('Mensagem enviada', undefined, 'success');
  }, [currentUser, showToast, supabase]);

  const contextValue = useMemo<AppContextType>(() => ({
    theme,
    setTheme,
    currentUser,
    setCurrentUser,
    updateUserProfile,
    switchUser,
    logout,
    requireAuth,
    authPrompt,
    closeAuthPrompt,
    pets,
    addPet,
    updatePet,
    deletePet,
    favorites: validFavorites,
    toggleFavorite,
    isFavorite,
    showFavoritesOnly,
    setShowFavoritesOnly,
    applications,
    submitApplication,
    updateApplicationStatus,
    updateGuardianNotes,
    sendApplicationMessage,
    toasts,
    showToast,
    removeToast,
    calculateAge,
    isAgeAllowed,
    analyzeDossier,
    calculateSmartMatch,
  }), [
    theme,
    setTheme,
    currentUser,
    setCurrentUser,
    updateUserProfile,
    switchUser,
    logout,
    requireAuth,
    authPrompt,
    closeAuthPrompt,
    pets,
    addPet,
    updatePet,
    deletePet,
    validFavorites,
    toggleFavorite,
    isFavorite,
    showFavoritesOnly,
    setShowFavoritesOnly,
    applications,
    submitApplication,
    updateApplicationStatus,
    updateGuardianNotes,
    sendApplicationMessage,
    toasts,
    showToast,
    removeToast,
    calculateAge,
    isAgeAllowed,
    analyzeDossier,
    calculateSmartMatch,
  ]);

  return <AppContext.Provider value={contextValue}>{children}</AppContext.Provider>;
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
