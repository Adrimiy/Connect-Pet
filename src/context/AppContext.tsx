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
  HousingType,
  SpeciesPreference,
  SizePreference
} from '../types';
import { createClient } from '@/lib/client';
import { removerFotosDoStorage } from '@/lib/petPhotos';
import { normalizarFotosPet, obterUrlImagemPermitida } from '@/lib/origensImagem';
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
  authLoading: boolean;
  updateUserProfile: (updates: Partial<CurrentUser> & { avatar?: string | null }) => Promise<boolean>;
  logout: () => void | Promise<void>;

  // Controle de acesso: retorna true se autenticado; caso contrário abre o modal de acesso restrito
  requireAuth: (feature?: AuthFeature, options?: { redirectTo?: string }) => boolean;
  authPrompt: AuthPromptState | null;
  closeAuthPrompt: () => void;

  // Pets
  pets: Pet[];
  petsLoading: boolean;
  petsError: string | null;
  reloadPets: () => Promise<void>;
  addPet: (pet: Omit<Pet, 'id' | 'createdAt'>) => Promise<boolean>;
  updatePet: (id: string, updates: Partial<Pet>) => Promise<boolean>;
  deletePet: (id: string) => Promise<boolean>;

  // Favorites
  favorites: string[];
  toggleFavorite: (petId: string) => Promise<boolean>;
  isFavorite: (petId: string) => boolean;
  showFavoritesOnly: boolean;
  setShowFavoritesOnly: React.Dispatch<React.SetStateAction<boolean>>;

  // Applications
  applications: PreAdoptionApplication[];
  applicationsLoading: boolean;
  applicationsError: string | null;
  reloadApplications: () => void;
  submitApplication: (applicationData: Omit<PreAdoptionApplication, 'id' | 'createdAt' | 'status' | 'notes' | 'messages' | 'automatedAnalysis'>) => Promise<PreAdoptionApplication | null>;
  updateApplicationStatus: (appId: string, status: ApplicationStatus) => Promise<boolean>;
  updateGuardianNotes: (appId: string, notes: string) => Promise<boolean>;
  sendApplicationMessage: (appId: string, content: string) => Promise<boolean>;

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
  THEME: 'acolher_theme_mode_v1',
};

const AppContext = createContext<AppContextType | undefined>(undefined);

function normalizePet(raw: unknown): Pet {
  const rawObj = (raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {}) as Record<string, unknown>;
  const photos = normalizarFotosPet(
    Array.isArray(rawObj.photos) && rawObj.photos.length > 0
      ? rawObj.photos
      : rawObj.images
  );

  let location = { city: "", state: "", neighborhood: "" };
  const rawLoc = rawObj.location;
  if (rawLoc && typeof rawLoc === "object") {
    const locObj = rawLoc as Record<string, string>;
    location = {
      city: locObj.city || "",
      state: locObj.state || "",
      neighborhood: locObj.neighborhood || ""
    };
  } else if (typeof rawLoc === "string") {
    const parts = rawLoc.split(",").map((s: string) => s.trim());
    location = {
      city: parts[0] || "",
      state: parts[1] || "",
      neighborhood: ""
    };
  }

  let temperament: string[] = [];
  if (Array.isArray(rawObj.temperament)) {
    temperament = rawObj.temperament as string[];
  } else if (typeof rawObj.temperament === "string") {
    temperament = rawObj.temperament.split(",").map((s: string) => s.trim()).filter(Boolean);
  }

  return {
    id: String(rawObj.id || ""),
    name: String(rawObj.name || "Sem Nome"),
    species: rawObj.species === "cat" || rawObj.species === "Gato" ? "cat" : "dog",
    breed: String(rawObj.breed || "Não informada"),
    size: rawObj.size === "small" || rawObj.size === "Pequeno" ? "small" : rawObj.size === "large" || rawObj.size === "Grande" ? "large" : "medium",
    approximateAge: String(rawObj.approximateAge || rawObj.age || "Não informada"),
    ageCategory: (rawObj.ageCategory as Pet['ageCategory']) || "young",
    sex: rawObj.sex === "female" || rawObj.gender === "Fêmea" ? "female" : "male",
    status: rawObj.status === "adopted" || rawObj.status === "Adotado" ? "adopted" : rawObj.status === "in_process" || rawObj.status === "Em processo" ? "in_process" : "available",
    vaccinated: !!rawObj.vaccinated,
    castrated: !!rawObj.castrated,
    dewormed: !!rawObj.dewormed,
    vaccinationDetails: String(rawObj.vaccinationDetails || ""),
    specialNeeds: String(rawObj.specialNeeds || ""),
    photos,
    headline: String(rawObj.headline || "Informações em atualização."),
    story: String(rawObj.story || rawObj.history || "História ainda não informada pelo responsável."),
    temperament,
    temperamentDescription: String(rawObj.temperamentDescription || "Informações de convivência ainda não fornecidas."),
    guardianId: String(rawObj.guardianId || ""),
    guardianName: String(rawObj.guardianName || "Responsável não informado"),
    guardianType: (rawObj.guardianType as Pet['guardianType']) || (rawObj.isOng ? "ngo" : "individual"),
    guardianPhone: String(rawObj.guardianPhone || ""),
    guardianEmail: String(rawObj.guardianEmail || ""),
    location,
    createdAt: String(rawObj.createdAt || "")
  };
}

function mapearPetDoBanco(pet: Record<string, unknown>): Pet {
  return normalizePet({
    id: pet.id,
    name: pet.name,
    species: pet.species,
    breed: pet.breed,
    size: pet.size,
    approximateAge: pet.approximate_age,
    ageCategory: pet.age_category,
    sex: pet.sex,
    status: pet.status,
    vaccinated: pet.vaccinated,
    castrated: pet.castrated,
    dewormed: pet.dewormed,
    vaccinationDetails: pet.vaccination_details,
    specialNeeds: pet.special_needs,
    photos: pet.photos,
    headline: pet.headline,
    story: pet.story,
    temperament: pet.temperament,
    temperamentDescription: pet.temperament_description,
    guardianId: pet.guardian_id,
    guardianName: pet.guardian_name,
    guardianType: pet.guardian_type,
    guardianPhone: pet.guardian_phone,
    guardianEmail: pet.guardian_email,
    location: {
      city: pet.city || '',
      state: pet.state || '',
      neighborhood: pet.neighborhood || ''
    },
    createdAt: pet.created_at
  });
}

function cleanAvatar(val: unknown): string | undefined {
  if (typeof val === 'string' && val.trim().length > 0 && val !== 'null' && val !== 'undefined') {
    return obterUrlImagemPermitida(val) || undefined;
  }
  return undefined;
}

async function fetchUserProfile(supabaseClient: ReturnType<typeof createClient>, sessionUser: SupabaseUser): Promise<CurrentUser | null> {
  const meta = (sessionUser.user_metadata || {}) as Record<string, unknown>;

  // Remove resquícios de avatar Base64 do JWT antes de continuar. Sem aguardar,
  // uma navegação pode reenviar o cookie antigo e ultrapassar o limite de headers.
  if (typeof meta.avatar === 'string' && meta.avatar.startsWith('data:')) {
    const { error } = await supabaseClient.auth.updateUser({ data: { avatar: null } });
    if (error) {
      console.warn('Não foi possível remover o avatar Base64 dos metadados de autenticação:', error.message);
    }
  }

  const { data: profile, error } = await supabaseClient
      .from('profiles')
      .select('id, role, name, email, primary_phone, secondary_phone, avatar, cpf, rg, birth_date, profession, social_media, housing_type, has_adequate_space, has_other_pets, other_pets_details, has_children, species_preference, size_preference, guardian_type, responsible_name, document, city, state, neighborhood, description, bio, verified')
      .eq('id', sessionUser.id)
      .maybeSingle();

  if (!error && profile) {
      // Se profile.avatar foi explicitamente setado como null ou vazio, a foto foi removida do cadastro
      const resolvedAvatar = (profile.avatar === null || profile.avatar === '')
        ? undefined
        : cleanAvatar(profile.avatar);

      if (profile.role === 'guardian') {
        return {
          id: profile.id,
          role: 'guardian',
          guardianType: profile.guardian_type || 'ngo',
          name: profile.name || 'Responsável',
          responsibleName: profile.responsible_name || undefined,
          document: profile.document || '',
          email: profile.email || sessionUser.email || '',
          primaryPhone: profile.primary_phone || '',
          city: profile.city || '',
          state: profile.state || '',
          neighborhood: profile.neighborhood || '',
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
          birthDate: profile.birth_date || '',
          primaryPhone: profile.primary_phone || '',
          secondaryPhone: profile.secondary_phone || undefined,
          email: profile.email || sessionUser.email || '',
          profession: profile.profession || undefined,
          socialMedia: profile.social_media || undefined,
          avatar: resolvedAvatar,
          city: profile.city || '',
          state: profile.state || '',
          housingType: (profile.housing_type as HousingType) || undefined,
          hasAdequateSpace: profile.has_adequate_space ?? undefined,
          hasOtherPets: profile.has_other_pets ?? undefined,
          otherPetsDetails: profile.other_pets_details || undefined,
          hasChildren: profile.has_children ?? undefined,
          speciesPreference: (profile.species_preference as SpeciesPreference) || undefined,
          sizePreference: (profile.size_preference as SizePreference) || undefined,
          bio: profile.bio || undefined
        };
      }
  }

  console.warn('Não foi possível carregar o perfil autenticado:', error?.message || 'Perfil inexistente.');
  return null;
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

  // O perfil visual só é preenchido depois que uma sessão real do Supabase é confirmada.
  const [currentUser, setCurrentUserState] = useState<CurrentUser | null>(null);
  const [authLoading, setAuthLoading] = useState(() => Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  ));

  // 3. Pets State
  const [pets, setPetsState] = useState<Pet[]>([]);
  const [petsLoading, setPetsLoading] = useState(true);
  const [petsError, setPetsError] = useState<string | null>(null);

  // 4. Favorites State - Isolado por usuário
  const [favorites, setFavoritesState] = useState<string[]>([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState<boolean>(false);

  // 5. Applications State - Inicia vazio (sem mocks fictícios)
  const [applications, setApplicationsState] = useState<PreAdoptionApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [applicationsError, setApplicationsError] = useState<string | null>(null);
  const [applicationsReloadToken, setApplicationsReloadToken] = useState(0);

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

  const reloadPets = useCallback(async () => {
    if (!supabase) {
      setPetsState([]);
      setPetsError('A conexão com o catálogo não está configurada.');
      setPetsLoading(false);
      return;
    }

    setPetsLoading(true);
    setPetsError(null);
    try {
      const { data, error } = await supabase
        .from('pets')
        .select('id, name, species, breed, size, approximate_age, age_category, sex, status, vaccinated, castrated, dewormed, vaccination_details, special_needs, photos, headline, story, temperament, temperament_description, guardian_id, guardian_name, guardian_type, guardian_phone, guardian_email, city, state, neighborhood, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPetsState((data ?? []).map((pet) => mapearPetDoBanco(pet as Record<string, unknown>)));
    } catch (error) {
      console.warn('Não foi possível carregar o catálogo:', error);
      setPetsState([]);
      setPetsError('Não foi possível carregar os animais. Tente novamente.');
    } finally {
      setPetsLoading(false);
    }
  }, [supabase]);

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
          setCurrentUserState(null);
          setFavoritesState([]);
          setApplicationsState([]);
          setApplicationsError(null);
          setApplicationsLoading(false);
        }
        return;
      }

      let profile: CurrentUser | null = null;
      try {
        profile = await fetchUserProfile(supabase!, sessionUser);
      } catch (error) {
        console.warn('Não foi possível consultar o perfil autenticado:', error);
      }
      if (!isMounted) return;

      setCurrentUserState(profile);
      if (!profile) {
        setFavoritesState([]);
        setApplicationsState([]);
        setApplicationsError(null);
        setApplicationsLoading(false);
        return;
      }

      // Buscar favoritos reais do usuário autenticado no Supabase
      try {
        const { data: favData, error: favErr } = await supabase!
          .from('favorites')
          .select('pet_id')
          .eq('user_id', sessionUser.id);

        if (!favErr && Array.isArray(favData) && isMounted) {
          const ids = favData.map((f: { pet_id: string }) => f.pet_id);
          setFavoritesState(ids);
        } else {
          setFavoritesState([]);
          console.warn('Não foi possível carregar os favoritos:', favErr?.message);
        }
      } catch (err) {
        console.warn('Supabase favorites fetch warning:', err);
        if (isMounted) setFavoritesState([]);
      }
    }

    // 1. Verificar sessão ativa no carregamento inicial / F5
    supabase.auth.getUser()
      .then(async ({ data, error }) => {
        if (!isMounted) return;
        if (error) console.warn('Não foi possível validar a sessão:', error.message);
        await handleUserSession(data.user ?? null);
      })
      .catch((error) => {
        console.warn('Não foi possível validar a sessão:', error);
        if (isMounted) setCurrentUserState(null);
      })
      .finally(() => {
        if (isMounted) setAuthLoading(false);
      });

    // 2. Escutar mudanças em tempo real (LOGIN, LOGOUT, REFRESH_TOKEN)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        if (session?.user) {
          window.setTimeout(() => void handleUserSession(session.user), 0);
        }
      } else if (event === 'SIGNED_OUT') {
        window.setTimeout(() => void handleUserSession(null), 0);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  // Fetch Pets and Applications from Supabase on mount
  useEffect(() => {
    let isMounted = true;

    async function syncFromSupabase() {
      try {
        await reloadPets();

        if (!supabase) {
          if (isMounted) {
            setApplicationsState([]);
            setApplicationsError('A conexão com as candidaturas não está configurada.');
            setApplicationsLoading(false);
          }
          return;
        }

        if (!currentUser) {
          if (isMounted) {
            setApplicationsState([]);
            setApplicationsError(null);
            setApplicationsLoading(false);
          }
          return;
        }

        if (isMounted) {
          setApplicationsLoading(true);
          setApplicationsError(null);
        }

        // 2. Fetch Applications with joined pets and messages
        const { data: remoteApps, error: appsError } = await supabase
          .from('applications')
          .select('id, pet_id, candidate_name, candidate_email, candidate_phone, guardian_id, status, candidate, housing, routine, finance, dossier, automated_analysis, guardian_notes, created_at, pet_name, pet_photo, pet_species, guardian_name, guardian_type, candidate_id, pets(id, name, photos, species), application_messages(id, sender_name, sender_role, message, created_at)')
          .order('created_at', { ascending: false });

        if (appsError) {
          console.warn('Não foi possível carregar as candidaturas:', appsError.message);
          if (isMounted) {
            setApplicationsState([]);
            setApplicationsError('Não foi possível carregar as candidaturas. Tente novamente.');
          }
        } else if (Array.isArray(remoteApps) && isMounted) {
          const mappedApps: PreAdoptionApplication[] = remoteApps.map((a: Record<string, unknown>) => {
            const candidate = (a.candidate || {}) as Record<string, string>;
            const housing = (a.housing || {}) as Record<string, unknown>;
            const routine = (a.routine || {}) as Record<string, unknown>;
            const finance = (a.finance || {}) as Record<string, unknown>;
            const dossier = (a.dossier || {}) as Record<string, unknown>;

            const petObj = (a.pets && typeof a.pets === 'object' ? a.pets : null) as Record<string, unknown> | null;
            const petPhotos = petObj && Array.isArray(petObj.photos) ? (petObj.photos as string[]) : [];
            const petPhoto = normalizarFotosPet(
              petPhotos.length > 0 ? petPhotos : [a.pet_photo]
            )[0];
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
                : [];

            return {
              id: String(a.id),
              petId: String(a.pet_id || ''),
              petName,
              petPhoto,
              petSpecies,
              guardianId: String(a.guardian_id || ''),
              guardianName: String(a.guardian_name || 'Responsável não informado'),
              guardianType: (a.guardian_type as Pet['guardianType']) || 'ngo',
              candidateId: String(a.candidate_id || candidate.id || ''),
              candidate: {
                name: candidate.name || String(a.candidate_name || 'Candidato'),
                birthDate: candidate.birthDate || '',
                profession: candidate.profession || '',
                primaryPhone: candidate.primaryPhone || candidate.phone || String(a.candidate_phone || ''),
                email: candidate.email || String(a.candidate_email || ''),
                socialMedia: candidate.socialMedia || '',
                cpf: candidate.cpf || '',
                rg: candidate.rg || ''
              },
              housingType: (housing.housingType as PreAdoptionApplication['housingType']) || 'casa',
              housingStatus: (housing.housingStatus as PreAdoptionApplication['housingStatus']) || 'alugado',
              landlordPermission: !!housing.landlordPermission,
              hasProtection: !!housing.hasProtection,
              protectionDetails: String(housing.protectionDetails || ''),
              accessArea: (housing.accessArea as PreAdoptionApplication['accessArea']) || 'area_especifica',
              adultsCount: typeof routine.adultsCount === 'number' ? routine.adultsCount : 0,
              childrenCount: typeof routine.childrenCount === 'number' ? routine.childrenCount : 0,
              familyAgreement: !!routine.familyAgreement,
              allergyCases: !!routine.allergyCases,
              allergyDetails: String(routine.allergyDetails || ''),
              hoursAlone: typeof routine.hoursAlone === 'number' ? routine.hoursAlone : 0,
              travelCarePlan: String(routine.travelCarePlan || ''),
              hasCurrentPets: !!routine.hasCurrentPets,
              currentPetsDetails: Array.isArray(routine.currentPetsDetails) ? (routine.currentPetsDetails as PreAdoptionApplication['currentPetsDetails']) : undefined,
              previousPetsHistory: String(routine.previousPetsHistory || ''),
              costAwareness: !!finance.costAwareness,
              status: (a.status as ApplicationStatus) || 'pending',
              createdAt: String(a.created_at || new Date().toISOString()),
              notes: Array.isArray(a.notes) ? (a.notes as string[]) : [],
              guardianNotes: String(a.guardian_notes || ''),
              messages: rawMessages,
              automatedAnalysis: (dossier.automatedAnalysis || a.automated_analysis || {
                suitabilityScore: 0,
                verdict: 'Análise indisponível',
                strengths: [],
                attentionPoints: [],
                suggestedQuestions: []
              }) as NonNullable<PreAdoptionApplication['automatedAnalysis']>
            };
          });

          setApplicationsState(mappedApps);
        }
      } catch (err) {
        console.warn('Não foi possível sincronizar as candidaturas:', err);
        if (isMounted) {
          setApplicationsState([]);
          setApplicationsError('Não foi possível carregar as candidaturas. Tente novamente.');
        }
      } finally {
        if (isMounted) setApplicationsLoading(false);
      }
    }

    syncFromSupabase();

    return () => {
      isMounted = false;
    };
  }, [applicationsReloadToken, currentUser, reloadPets, supabase]);

  // Set Theme with persistence
  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, newTheme);
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

  const logout = useCallback(async () => {
    if (!supabase) {
      showToast('Não foi possível sair', 'A conexão com a autenticação não está configurada.', 'error');
      return;
    }
    try {
      const { error } = await supabase.auth.signOut({ scope: 'local' });
      if (error) throw error;
    } catch (err) {
      console.warn('Não foi possível encerrar a sessão:', err);
      showToast('Não foi possível sair', 'Tente novamente em alguns instantes.', 'error');
      return;
    }
    setCurrentUserState(null);
    setFavoritesState([]);
    setApplicationsState([]);
    setApplicationsError(null);
    setApplicationsLoading(false);
    showToast('Sessão encerrada', 'Você saiu da sua conta com sucesso.', 'info');
  }, [supabase, showToast]);

  // Atualizar o perfil persistido no Supabase e refletir o resultado confirmado na interface.
  const updateUserProfile = useCallback(async (updates: Partial<CurrentUser> & { avatar?: string | null }) => {
    if (!currentUser || !supabase) {
      showToast('Não foi possível salvar', 'Sua sessão não está disponível. Entre novamente.', 'error');
      return false;
    }
    const isRemovingAvatar = updates.avatar === null || updates.avatar === '';
    const newAvatar = isRemovingAvatar ? undefined : (updates.avatar ?? currentUser.avatar);
    if (newAvatar?.startsWith('data:')) {
      showToast('Foto não salva', 'A imagem precisa ser enviada ao armazenamento antes de salvar o perfil.', 'error');
      return false;
    }

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
    let falhaSincronizacaoPets = false;

    try {
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

        const { data: savedProfile, error: profileError } = await supabase
          .from('profiles')
          .update(dbUpdates)
          .eq('id', updatedUser.id)
          .select('id')
          .maybeSingle();

        if (profileError || !savedProfile) {
          throw profileError || new Error('O perfil não foi localizado para atualização.');
        }

        if (updatedUser.role === 'guardian') {
          const { error: petsError } = await supabase
            .from('pets')
            .update({
              guardian_name: updatedUser.name,
              guardian_phone: updatedUser.primaryPhone,
              guardian_email: updatedUser.email,
              city: updatedUser.city,
              state: updatedUser.state,
              neighborhood: updatedUser.neighborhood
            })
            .eq('guardian_id', updatedUser.id);
          if (petsError) {
            falhaSincronizacaoPets = true;
            console.warn('O perfil foi salvo, mas os anúncios não foram sincronizados:', petsError.message);
          }

          if (!petsError) {
            setPetsState((anteriores) => anteriores.map((pet) => pet.guardianId === updatedUser.id ? {
              ...pet,
              guardianName: updatedUser.name,
              guardianPhone: updatedUser.primaryPhone,
              guardianEmail: updatedUser.email,
              location: {
                city: updatedUser.city,
                state: updatedUser.state,
                neighborhood: updatedUser.neighborhood
              }
            } : pet));
          }
        }
    } catch (err) {
      console.warn('Não foi possível atualizar o perfil:', err);
      showToast('Não foi possível salvar', 'Confira sua conexão e tente novamente.', 'error');
      return false;
    }

    setCurrentUserState(updatedUser);
    if (falhaSincronizacaoPets) {
      showToast('Perfil salvo', 'As informações do perfil foram atualizadas, mas os anúncios serão sincronizados após a atualização do banco.', 'warning');
    } else {
      showToast('Perfil atualizado com sucesso!', 'Suas informações foram salvas.', 'success');
    }
    return true;
  }, [currentUser, showToast, supabase]);

  // Pets Management
  const addPet = useCallback(async (newPetData: Omit<Pet, 'id' | 'createdAt'>) => {
    if (!supabase || currentUser?.role !== 'guardian' || newPetData.guardianId !== currentUser.id) {
      showToast('Cadastro não permitido', 'Entre com um perfil de ONG ou doador para publicar animais.', 'error');
      return false;
    }

    try {
      const { data, error } = await supabase
            .from('pets')
            .insert({
              name: newPetData.name,
              species: newPetData.species,
              breed: newPetData.breed,
              size: newPetData.size,
              approximate_age: newPetData.approximateAge,
              age_category: newPetData.ageCategory,
              sex: newPetData.sex,
              status: newPetData.status,
              vaccinated: newPetData.vaccinated,
              castrated: newPetData.castrated,
              dewormed: newPetData.dewormed,
              vaccination_details: newPetData.vaccinationDetails,
              special_needs: newPetData.specialNeeds,
              photos: newPetData.photos,
              headline: newPetData.headline,
              story: newPetData.story,
              temperament: newPetData.temperament,
              temperament_description: newPetData.temperamentDescription,
              guardian_id: currentUser.id,
              guardian_name: currentUser.name,
              guardian_type: currentUser.guardianType,
              guardian_phone: currentUser.primaryPhone,
              guardian_email: currentUser.email,
              city: currentUser.city,
              state: currentUser.state,
              neighborhood: currentUser.neighborhood
            })
            .select()
            .single();

      if (error || !data) throw error || new Error('O banco não retornou o animal cadastrado.');

      const petCriado = mapearPetDoBanco(data as Record<string, unknown>);
      setPetsState((anteriores) => [petCriado, ...anteriores]);
      showToast('Animal cadastrado!', `${petCriado.name} já está visível para adoção.`, 'success');
      return true;
    } catch (err) {
      console.warn('Não foi possível cadastrar o animal:', err);
      await removerFotosDoStorage(supabase, newPetData.photos);
      showToast('Não foi possível cadastrar', 'O animal não foi publicado. Confira os dados e tente novamente.', 'error');
      return false;
    }
  }, [currentUser, showToast, supabase]);

  const updatePet = useCallback(async (id: string, updates: Partial<Pet>) => {
    const petAnterior = pets.find((p) => p.id === id);
    const pertenceAoUsuario = currentUser?.role === 'guardian' && !!petAnterior && petAnterior.guardianId === currentUser.id;

    if (!pertenceAoUsuario || !supabase) {
      showToast('Edição não permitida', 'Você só pode editar animais publicados por este perfil.', 'error');
      return false;
    }

    const fotosAnteriores = petAnterior.photos;

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
          const { data, error } = await supabase
            .from('pets')
            .update(remoteUpdates)
            .eq('id', id)
            .eq('guardian_id', currentUser.id)
            .select('id')
            .maybeSingle();

          if (error || !data) {
            if (updates.photos !== undefined) {
              await removerFotosDoStorage(
                supabase,
                updates.photos.filter((url) => !fotosAnteriores.includes(url))
              );
            }

            console.warn('Supabase pet update failed:', error?.message || 'Nenhum animal pertencente ao perfil foi atualizado.');
            showToast('Não foi possível salvar', 'Confira sua conexão e tente novamente.', 'error');
            return false;
          }

          setPetsState((anteriores) =>
            anteriores.map((pet) => pet.id === id ? { ...pet, ...updates } : pet)
          );

          if (updates.photos !== undefined) {
            await removerFotosDoStorage(
              supabase,
              fotosAnteriores.filter((url) => !updates.photos!.includes(url))
            );
          }
        }
    } catch (err) {
        console.warn('Supabase pet update error:', err);
        if (updates.photos !== undefined) {
          await removerFotosDoStorage(
            supabase,
            updates.photos.filter((url) => !fotosAnteriores.includes(url))
          );
        }
        showToast('Não foi possível salvar', 'Ocorreu um erro inesperado. Tente novamente.', 'error');
        return false;
    }

    showToast('Pet atualizado', 'As alterações foram salvas com sucesso.', 'success');
    return true;
  }, [currentUser, pets, showToast, supabase]);

  const deletePet = useCallback(async (id: string) => {
    const petToDelete = pets.find((p) => p.id === id);
    if (!supabase || currentUser?.role !== 'guardian' || !petToDelete || petToDelete.guardianId !== currentUser.id) {
      showToast('Exclusão não permitida', 'Você só pode remover animais publicados por este perfil.', 'error');
      return false;
    }

    try {
      const { data, error } = await supabase
        .from('pets')
        .delete()
        .eq('id', id)
        .eq('guardian_id', currentUser.id)
        .select('id')
        .maybeSingle();

      if (error || !data) throw error || new Error('O animal não foi localizado para exclusão.');

      setPetsState((anteriores) => anteriores.filter((pet) => pet.id !== id));
      await removerFotosDoStorage(supabase, petToDelete.photos);
      showToast('Pet removido', `${petToDelete.name} foi removido do catálogo.`, 'info');
      return true;
    } catch (err) {
      console.warn('Não foi possível excluir o animal:', err);
      showToast('Não foi possível excluir', 'O animal continua publicado. Tente novamente.', 'error');
      return false;
    }
  }, [currentUser, pets, showToast, supabase]);

  // Controle de acesso reutilizável
  const requireAuth = useCallback((feature: AuthFeature = 'default', options?: { redirectTo?: string }) => {
    if (currentUser) return true;
    setAuthPrompt({ feature, redirectTo: options?.redirectTo });
    return false;
  }, [currentUser]);

  const closeAuthPrompt = useCallback(() => setAuthPrompt(null), []);
  const reloadApplications = useCallback(() => {
    setApplicationsReloadToken((token) => token + 1);
  }, []);

  // Favorites
  const toggleFavorite = useCallback(async (petId: string) => {
    if (!requireAuth('favorites') || !currentUser) return false;
    if (!supabase) {
      showToast('Favoritos indisponíveis', 'Não foi possível conectar ao banco de dados.', 'error');
      return false;
    }

    const isCurrentlyFav = validFavorites.includes(petId);
    const updated = isCurrentlyFav
      ? validFavorites.filter((id) => id !== petId)
      : [...validFavorites, petId];

    try {
      const { error } = isCurrentlyFav
        ? await supabase.from('favorites').delete().eq('user_id', currentUser.id).eq('pet_id', petId)
        : await supabase.from('favorites').insert({ user_id: currentUser.id, pet_id: petId });
      if (error) throw error;
    } catch (err) {
      console.warn('Não foi possível atualizar o favorito:', err);
      showToast('Não foi possível atualizar', 'Tente novamente em alguns instantes.', 'error');
      return false;
    }

    setFavoritesState(updated);

    if (isCurrentlyFav) {
      showToast('Removido dos favoritos', undefined, 'info');
    } else {
      showToast('Adicionado aos favoritos!', 'Você pode acompanhar seus pets favoritos.', 'success');
    }
    return true;
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
  const submitApplication = useCallback(async (data: Omit<PreAdoptionApplication, 'id' | 'createdAt' | 'status' | 'notes' | 'messages' | 'automatedAnalysis'>): Promise<PreAdoptionApplication | null> => {
    if (!supabase || currentUser?.role !== 'adopter') {
      showToast('Candidatura não enviada', 'Entre com um perfil de adotante para continuar.', 'error');
      return null;
    }

    const userBirthDate = (currentUser as AdopterProfile).birthDate;
    const effectiveBirthDate = userBirthDate || data.candidate.birthDate;
    if (!effectiveBirthDate || calculateAge(effectiveBirthDate) < 21) {
      showToast('Candidatura não enviada', 'É necessário ter 21 anos completos e uma data de nascimento cadastrada.', 'error');
      return null;
    }
    const candidaturaAtiva = applications.some((application) =>
      application.petId === data.petId
      && application.candidateId === currentUser.id
      && application.status !== 'rejected'
    );
    if (candidaturaAtiva) {
      showToast('Candidatura já existente', 'Você já possui uma candidatura para este animal.', 'info');
      return null;
    }

    const sanitizedData = {
      ...data,
      candidateId: currentUser.id,
      candidate: {
        ...data.candidate,
        name: currentUser.name,
        email: currentUser.email,
        birthDate: effectiveBirthDate,
        primaryPhone: currentUser.primaryPhone,
        cpf: currentUser.cpf,
        rg: currentUser.rg || ''
      }
    };

    const analysis = analyzeDossier(sanitizedData);
    try {
      const { data: created, error } = await supabase
            .from('applications')
            .insert({
              pet_id: data.petId,
              candidate_name: sanitizedData.candidate.name,
              candidate_email: currentUser.email,
              candidate_phone: sanitizedData.candidate.primaryPhone || '',
              guardian_id: data.guardianId,
              status: 'pending',
              candidate: sanitizedData.candidate,
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
            .select('id, created_at')
            .single();

      if (error || !created) throw error || new Error('O banco não retornou a candidatura criada.');

      const conteudoMensagem = `Olá! Acabei de enviar minha candidatura para adotar ${data.petName}. Fico à disposição para conversar e agendar uma visita!`;
      const { data: mensagemCriada, error: erroMensagem } = await supabase
        .from('application_messages')
        .insert({
              application_id: created.id,
              sender_id: currentUser.id,
              sender_name: sanitizedData.candidate.name,
              sender_role: 'candidate',
              message: conteudoMensagem
        })
        .select('id, created_at')
        .maybeSingle();

      if (erroMensagem) console.warn('A candidatura foi criada, mas a mensagem inicial falhou:', erroMensagem.message);

      const newApp: PreAdoptionApplication = {
        ...sanitizedData,
        id: String(created.id),
        createdAt: String(created.created_at),
        status: 'pending',
        notes: [],
        guardianNotes: '',
        messages: mensagemCriada ? [{
          id: String(mensagemCriada.id),
          senderName: sanitizedData.candidate.name,
          senderRole: 'adopter',
          content: conteudoMensagem,
          sentAt: String(mensagemCriada.created_at)
        }] : [],
        automatedAnalysis: analysis
      };

      setApplicationsState((anteriores) => [newApp, ...anteriores]);
      setPetsState((anteriores) => anteriores.map((pet) =>
        pet.id === data.petId ? { ...pet, status: 'in_process' as const } : pet
      ));
      showToast('Candidatura enviada!', `Seu dossiê para adotar ${data.petName} foi recebido pela ONG.`, 'success');
      return newApp;
    } catch (err) {
      console.warn('Não foi possível enviar a candidatura:', err);
      showToast('Candidatura não enviada', 'Confira sua conexão e tente novamente.', 'error');
      return null;
    }
  }, [analyzeDossier, applications, calculateAge, currentUser, showToast, supabase]);

  const updateApplicationStatus = useCallback(async (appId: string, status: ApplicationStatus) => {
    if (!supabase || currentUser?.role !== 'guardian') return false;
    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', appId)
      .eq('guardian_id', currentUser.id)
      .select('id')
      .maybeSingle();

    if (error || !data) {
      console.warn('Não foi possível atualizar o status:', error?.message);
      showToast('Status não atualizado', 'Tente novamente em alguns instantes.', 'error');
      return false;
    }

    setApplicationsState((anteriores) => anteriores.map((app) => app.id === appId ? { ...app, status } : app));
    reloadApplications();
    showToast('Status atualizado', 'O andamento da candidatura foi atualizado com sucesso.', 'success');
    return true;
  }, [currentUser, reloadApplications, showToast, supabase]);

  const updateGuardianNotes = useCallback(async (appId: string, notes: string) => {
    if (!supabase || currentUser?.role !== 'guardian') return false;
    const { data, error } = await supabase
      .from('applications')
      .update({ guardian_notes: notes })
      .eq('id', appId)
      .eq('guardian_id', currentUser.id)
      .select('id')
      .maybeSingle();

    if (error || !data) {
      console.warn('Não foi possível salvar a nota:', error?.message);
      showToast('Nota não salva', 'Tente novamente em alguns instantes.', 'error');
      return false;
    }

    setApplicationsState((anteriores) => anteriores.map((app) => app.id === appId ? { ...app, guardianNotes: notes } : app));
    showToast('Nota salva', 'Anotações internas da ONG atualizadas.', 'info');
    return true;
  }, [currentUser, showToast, supabase]);

  const sendApplicationMessage = useCallback(async (appId: string, content: string) => {
    const mensagem = content.trim();
    if (!mensagem || !supabase || !currentUser) return false;

    const { data, error } = await supabase
      .from('application_messages')
      .insert({
        application_id: appId,
        sender_id: currentUser.id,
        sender_name: currentUser.name,
        sender_role: currentUser.role === 'guardian' ? 'guardian' : 'candidate',
        message: mensagem
      })
      .select('id, created_at')
      .single();

    if (error || !data) {
      console.warn('Não foi possível enviar a mensagem:', error?.message);
      showToast('Mensagem não enviada', 'Tente novamente em alguns instantes.', 'error');
      return false;
    }

    const novaMensagem = {
      id: String(data.id),
      senderName: currentUser.name,
      senderRole: currentUser.role === 'guardian' ? ('guardian' as const) : ('adopter' as const),
      content: mensagem,
      sentAt: String(data.created_at)
    };
    setApplicationsState((anteriores) => anteriores.map((app) =>
      app.id === appId ? { ...app, messages: [...app.messages, novaMensagem] } : app
    ));
    showToast('Mensagem enviada', undefined, 'success');
    return true;
  }, [currentUser, showToast, supabase]);

  const contextValue = useMemo<AppContextType>(() => ({
    theme,
    setTheme,
    currentUser,
    authLoading,
    updateUserProfile,
    logout,
    requireAuth,
    authPrompt,
    closeAuthPrompt,
    pets,
    petsLoading,
    petsError,
    reloadPets,
    addPet,
    updatePet,
    deletePet,
    favorites: validFavorites,
    toggleFavorite,
    isFavorite,
    showFavoritesOnly,
    setShowFavoritesOnly,
    applications,
    applicationsLoading,
    applicationsError,
    reloadApplications,
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
    authLoading,
    updateUserProfile,
    logout,
    requireAuth,
    authPrompt,
    closeAuthPrompt,
    pets,
    petsLoading,
    petsError,
    reloadPets,
    addPet,
    updatePet,
    deletePet,
    validFavorites,
    toggleFavorite,
    isFavorite,
    showFavoritesOnly,
    setShowFavoritesOnly,
    applications,
    applicationsLoading,
    applicationsError,
    reloadApplications,
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
