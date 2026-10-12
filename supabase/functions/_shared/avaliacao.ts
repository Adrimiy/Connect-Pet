export const VERSAO_AVALIACAO = "connectpet-ia-v3";

export interface FatorAvaliacao {
  criterio: string;
  impacto: number;
  explicacao: string;
}

export interface AnaliseDeterministica {
  suitabilityScore: number;
  verdict: string;
  strengths: string[];
  attentionPoints: string[];
  suggestedQuestions: string[];
  resumo: string;
  justificativa: string;
  origem: "local";
  versao: string;
  geradoEm: string;
  fatores: FatorAvaliacao[];
}

export interface DadosCandidaturaAvaliacao {
  candidate?: { birthDate?: string };
  housingType?: "casa" | "apartamento" | "sobrado" | "sitio";
  housingStatus?: "proprio" | "alugado";
  landlordPermission?: boolean;
  hasProtection?: boolean;
  protectionDetails?: string;
  familyAgreement?: boolean;
  allergyCases?: boolean;
  allergyDetails?: string;
  hoursAlone?: number;
  dailyCarePlan?: string;
  travelCarePlan?: string;
  hasCurrentPets?: boolean;
  currentPetsDescription?: string;
  previousPetsHistory?: string;
  costAwareness?: boolean;
}

export interface PetParaAvaliacao {
  id: string;
  name?: string;
  species: "dog" | "cat";
  size: "small" | "medium" | "large";
  ageCategory: "puppy" | "young" | "adult" | "senior";
  energyLevel: "calm" | "moderate" | "high";
  compatibleWithChildren: "yes" | "no" | "unknown";
  compatibleWithDogs: "yes" | "no" | "unknown";
  compatibleWithCats: "yes" | "no" | "unknown";
  temperament: string[];
  specialNeeds?: string;
}

export interface QuestionarioCompatibilidade {
  preferredSpecies: "all" | "dog" | "cat";
  preferredSize: "all" | "small" | "medium" | "large";
  preferredAge: "all" | "puppy" | "young" | "adult" | "senior";
  preferredEnergy: "all" | "calm" | "moderate" | "high";
  hasChildren: boolean;
  residentPets: "none" | "dog" | "cat" | "both";
  acceptsSpecialNeeds: boolean;
}

export interface ResultadoCompatibilidadeLocal {
  score: number;
  compatibilityLevel: "high" | "medium" | "moderate";
  matchedReasons: string[];
  adaptationTips: string[];
  origemAnalise: "local";
}

function limitar(numero: number, minimo: number, maximo: number) {
  return Math.min(maximo, Math.max(minimo, Math.round(numero)));
}

function contemTemperamento(pet: PetParaAvaliacao, termos: string[]) {
  const normalizar = (texto: string) => texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .trim();
  const temperamentos = pet.temperament.map(normalizar);

  return termos.map(normalizar).some((termo) => temperamentos.some((item) => {
    if (item.includes(`nao ${termo}`)) return false;
    return item === termo || new RegExp(`(^|\\s)${termo}(\\s|$)`, "u").test(item);
  }));
}

function calcularIdade(dataNascimento?: string) {
  if (!dataNascimento) return null;
  const nascimento = new Date(`${dataNascimento}T12:00:00`);
  if (Number.isNaN(nascimento.getTime())) return null;
  const hoje = new Date();
  let idade = hoje.getFullYear() - nascimento.getFullYear();
  const diferencaMes = hoje.getMonth() - nascimento.getMonth();
  if (diferencaMes < 0 || (diferencaMes === 0 && hoje.getDate() < nascimento.getDate())) idade -= 1;
  return Math.max(0, idade);
}

export function avaliarCandidaturaDeterministica(
  candidatura: DadosCandidaturaAvaliacao,
  pet?: PetParaAvaliacao | null,
): AnaliseDeterministica {
  let pontuacao = 35;
  const fatores: FatorAvaliacao[] = [{
    criterio: "Base da triagem",
    impacto: 35,
    explicacao: "Ponto inicial neutro da escala antes da aplicação dos critérios declarados.",
  }];
  const pontosFavoraveis: string[] = [];
  const pontosAtencao: string[] = [];
  const perguntasSugeridas: string[] = [];

  const registrar = (criterio: string, impacto: number, explicacao: string) => {
    pontuacao += impacto;
    fatores.push({ criterio, impacto, explicacao });
  };

  const idade = calcularIdade(candidatura.candidate?.birthDate);
  if (idade !== null && idade >= 21) {
    registrar("Elegibilidade etária", 5, "A pessoa candidata atende à idade mínima definida pelo processo.");
    pontosFavoraveis.push("Atende à idade mínima de 21 anos para assumir a guarda responsável.");
  } else if (idade !== null) {
    registrar("Elegibilidade etária", -50, "A idade mínima obrigatória ainda não foi atingida.");
    pontosAtencao.push("A pessoa candidata ainda não atende à idade mínima de 21 anos.");
  }

  if (candidatura.hasProtection) {
    registrar("Segurança do ambiente", 15, "A residência foi informada como protegida contra quedas e fugas.");
    pontosFavoraveis.push("A moradia possui proteção física informada contra quedas e fugas.");
  } else {
    const impacto = pet?.species === "cat" || candidatura.housingType === "apartamento" ? -30 : -20;
    registrar("Segurança do ambiente", impacto, "Não há proteção física confirmada para a chegada do animal.");
    pontosAtencao.push("A proteção contra quedas e fugas precisa ser instalada e verificada antes da adoção.");
    perguntasSugeridas.push("Quais proteções serão instaladas e como poderão ser verificadas antes da entrega do pet?");
  }

  if (candidatura.housingStatus === "alugado") {
    if (candidatura.landlordPermission) {
      registrar("Permissão de moradia", 5, "Há permissão informada para manter animais no imóvel alugado.");
      pontosFavoraveis.push("Há autorização informada para o pet permanecer no imóvel alugado.");
    } else {
      registrar("Permissão de moradia", -20, "A autorização do locador ou condomínio não foi confirmada.");
      pontosAtencao.push("A permissão para animais no imóvel alugado ainda precisa ser comprovada.");
      perguntasSugeridas.push("O contrato de locação e o condomínio permitem a permanência do animal?");
    }
  }

  if (candidatura.familyAgreement) {
    registrar("Acordo familiar", 12, "Todos os moradores foram informados como de acordo com a adoção.");
    pontosFavoraveis.push("Todos os moradores declararam concordar com a adoção.");
  } else {
    registrar("Acordo familiar", -30, "Não há consenso declarado entre todas as pessoas da residência.");
    pontosAtencao.push("Ainda não existe concordância de todos os moradores.");
    perguntasSugeridas.push("Quais dúvidas ou ressalvas ainda existem entre os moradores?");
  }

  const horasSozinho = limitar(candidatura.hoursAlone ?? 4, 0, 24);
  if (horasSozinho <= 4) {
    registrar("Tempo de companhia", 10, `O pet ficaria sozinho por aproximadamente ${horasSozinho} hora(s) ao dia.`);
    pontosFavoraveis.push("A rotina oferece presença frequente durante o dia.");
  } else if (horasSozinho >= 9) {
    const impacto = pet?.ageCategory === "puppy" ? -25 : -15;
    registrar("Tempo de companhia", impacto, `O pet ficaria sozinho por aproximadamente ${horasSozinho} horas ao dia.`);
    pontosAtencao.push("O período diário sozinho é prolongado e exige um plano de enriquecimento e apoio.");
    perguntasSugeridas.push("Quem poderá visitar, passear ou interagir com o pet nos dias de ausência prolongada?");
  } else {
    registrar("Tempo de companhia", 0, `A rotina prevê cerca de ${horasSozinho} horas diárias sem companhia humana.`);
  }

  if (candidatura.dailyCarePlan && candidatura.dailyCarePlan.trim().length >= 20) {
    registrar("Responsabilidade diária", 8, "Foi descrita a organização dos cuidados cotidianos do pet.");
    pontosFavoraveis.push("Há um responsável e uma rotina declarados para os cuidados diários.");
  } else {
    registrar("Responsabilidade diária", -8, "A organização dos cuidados diários não foi detalhada.");
    pontosAtencao.push("A responsabilidade por alimentação, higiene, passeios e consultas precisa ser combinada.");
    perguntasSugeridas.push("Quem assumirá os cuidados diários e como as tarefas serão distribuídas?");
  }

  if (candidatura.travelCarePlan && candidatura.travelCarePlan.trim().length >= 20) {
    registrar("Plano para viagens", 8, "Foi apresentado um plano de cuidado para viagens e ausências.");
    pontosFavoraveis.push("Existe um plano descrito para viagens e ausências.");
  } else {
    registrar("Plano para viagens", -8, "O plano para ausências está ausente ou pouco detalhado.");
    pontosAtencao.push("O cuidado do animal durante viagens ainda não está bem definido.");
    perguntasSugeridas.push("Quem ficará responsável pelo pet em viagens, emergências ou mudanças de rotina?");
  }

  if (candidatura.costAwareness) {
    registrar("Planejamento financeiro", 12, "Há ciência declarada sobre custos contínuos e emergências veterinárias.");
    pontosFavoraveis.push("A pessoa declarou conhecer os custos recorrentes e veterinários.");
  } else {
    registrar("Planejamento financeiro", -25, "Não há confirmação de preparo para custos recorrentes e imprevistos.");
    pontosAtencao.push("O planejamento para despesas contínuas e emergências veterinárias precisa ser confirmado.");
    perguntasSugeridas.push("Como serão organizadas as despesas de alimentação, prevenção e emergências veterinárias?");
  }

  if (candidatura.allergyCases) {
    registrar("Alergias no domicílio", -10, "Foi relatada alergia e o manejo precisa ser validado com segurança.");
    pontosAtencao.push("Há relato de alergia no domicílio; o plano de manejo deve ser confirmado.");
    perguntasSugeridas.push("A alergia já foi avaliada por profissional e qual será o plano de manejo seguro?");
  }

  if (candidatura.hasCurrentPets) {
    if (pet && contemTemperamento(pet, ["sociável", "sociavel", "companheiro", "gentil"])) {
      registrar("Convivência com outros animais", 5, "O perfil informado do pet favorece uma apresentação gradual.");
      pontosFavoraveis.push("O histórico comportamental informado sugere potencial de convivência com outros animais.");
    } else {
      registrar("Convivência com outros animais", 0, "Já existem animais no lar e a compatibilidade precisa de apresentação supervisionada.");
      pontosAtencao.push("A convivência com os animais residentes deve ser testada de forma gradual.");
    }
    perguntasSugeridas.push("Como os animais atuais reagem a novos animais e como será feita a apresentação?");
    if (!candidatura.currentPetsDescription || candidatura.currentPetsDescription.trim().length < 10) {
      pontosAtencao.push("Os animais que já vivem no lar ainda não foram descritos.");
    }
  }

  if (candidatura.previousPetsHistory && candidatura.previousPetsHistory.trim().length >= 30) {
    registrar("Experiência prévia", 5, "Foi fornecido histórico de convivência e cuidados com animais.");
    pontosFavoraveis.push("Há experiência anterior descrita com cuidados de animais.");
  } else {
    registrar("Experiência prévia", 0, "A ausência de experiência não reprova, mas pede orientação inicial.");
    perguntasSugeridas.push("Que apoio ou orientação seria útil durante as primeiras semanas de adaptação?");
  }

  if (pet?.specialNeeds) {
    registrar("Necessidades específicas do pet", 0, "O pet possui necessidades informadas que exigem alinhamento explícito.");
    pontosAtencao.push("As necessidades específicas do pet devem ser explicadas e aceitas antes da decisão.");
    perguntasSugeridas.push("A rotina e o orçamento comportam os cuidados específicos indicados para este pet?");
  }

  const suitabilityScore = limitar(pontuacao, 0, 100);
  if (suitabilityScore !== pontuacao) {
    fatores.push({
      criterio: "Limite da escala",
      impacto: suitabilityScore - pontuacao,
      explicacao: "A soma foi ajustada para permanecer entre 0 e 100 pontos.",
    });
  }
  const verdict = suitabilityScore >= 85
    ? "Compatibilidade alta para entrevista"
    : suitabilityScore >= 70
      ? "Compatibilidade promissora com validações"
      : suitabilityScore >= 50
        ? "Requer entrevista aprofundada"
        : "Pontos essenciais pendentes";

  return {
    suitabilityScore,
    verdict,
    strengths: pontosFavoraveis.slice(0, 6),
    attentionPoints: pontosAtencao.slice(0, 6),
    suggestedQuestions: [...new Set(perguntasSugeridas)].slice(0, 5),
    resumo: `${verdict}. A pontuação é uma referência de triagem baseada nas respostas declaradas.`,
    justificativa: "A nota resulta apenas dos critérios exibidos abaixo; a IA não pode alterá-la e a decisão permanece com o responsável pelo animal.",
    origem: "local",
    versao: VERSAO_AVALIACAO,
    geradoEm: new Date().toISOString(),
    fatores,
  };
}

export function calcularCompatibilidadeDeterministica(
  questionario: QuestionarioCompatibilidade,
  pet: PetParaAvaliacao,
): ResultadoCompatibilidadeLocal {
  let pontuacao = 60;
  const motivos: string[] = [];
  const cuidados: string[] = [];

  if (questionario.preferredSpecies === "all" || questionario.preferredSpecies === pet.species) {
    pontuacao += questionario.preferredSpecies === "all" ? 0 : 12;
    motivos.push(questionario.preferredSpecies === "all" ? "Você está aberto à espécie deste pet." : "A espécie corresponde à sua preferência.");
  } else {
    pontuacao -= 35;
  }

  if (questionario.preferredSize === "all" || questionario.preferredSize === pet.size) {
    pontuacao += questionario.preferredSize === "all" ? 0 : 8;
    if (questionario.preferredSize !== "all") motivos.push("O porte corresponde ao que você procura.");
  } else {
    pontuacao -= 10;
  }

  if (questionario.preferredAge === "all" || questionario.preferredAge === pet.ageCategory) {
    if (questionario.preferredAge !== "all") {
      pontuacao += 8;
      motivos.push("A faixa etária corresponde à sua preferência.");
    }
  } else {
    pontuacao -= 8;
  }

  if (questionario.preferredEnergy === "all" || questionario.preferredEnergy === pet.energyLevel) {
    if (questionario.preferredEnergy !== "all") {
      pontuacao += 10;
      motivos.push("O nível de energia informado corresponde ao perfil que você procura.");
    }
  } else {
    pontuacao -= 12;
    cuidados.push("O nível de energia informado no anúncio difere da sua preferência.");
  }

  if (questionario.hasChildren) {
    if (pet.compatibleWithChildren === "yes") {
      pontuacao += 10;
      motivos.push("O responsável informou boa convivência observada com crianças.");
    } else if (pet.compatibleWithChildren === "no") {
      pontuacao -= 30;
      cuidados.push("O anúncio informa que a convivência com crianças não é recomendada.");
    } else cuidados.push("A convivência com crianças ainda não foi avaliada pelo responsável.");
  }

  const avaliarConvivencia = (tipo: "cão" | "gato", compatibilidade: PetParaAvaliacao["compatibleWithDogs"]) => {
    if (compatibilidade === "yes") {
      pontuacao += 8;
      motivos.push(`O responsável informou boa convivência observada com ${tipo === "cão" ? "cães" : "gatos"}.`);
    } else if (compatibilidade === "no") {
      pontuacao -= 25;
      cuidados.push(`O anúncio informa que a convivência com ${tipo === "cão" ? "cães" : "gatos"} não é recomendada.`);
    } else cuidados.push(`A convivência com ${tipo === "cão" ? "cães" : "gatos"} ainda não foi avaliada.`);
  };
  if (questionario.residentPets === "dog" || questionario.residentPets === "both") avaliarConvivencia("cão", pet.compatibleWithDogs);
  if (questionario.residentPets === "cat" || questionario.residentPets === "both") avaliarConvivencia("gato", pet.compatibleWithCats);

  if (pet.specialNeeds) {
    if (questionario.acceptsSpecialNeeds) {
      pontuacao += 5;
      motivos.push("Você está aberto às necessidades especiais informadas neste anúncio.");
      cuidados.push("Confirme com o responsável os cuidados ligados às necessidades específicas deste pet.");
    } else {
      pontuacao -= 25;
      cuidados.push("Este pet possui necessidades especiais e você indicou não ter disponibilidade neste momento.");
    }
  }

  const score = limitar(pontuacao, 20, 99);
  if (motivos.length === 0) motivos.push("O perfil será melhor validado em conversa com o responsável pelo animal.");
  if (cuidados.length === 0) cuidados.push("Planeje uma adaptação gradual e mantenha acompanhamento veterinário preventivo.");

  return {
    score,
    compatibilityLevel: score >= 80 ? "high" : score >= 65 ? "medium" : "moderate",
    matchedReasons: [...new Set(motivos)].slice(0, 4),
    adaptationTips: [...new Set(cuidados)].slice(0, 3),
    origemAnalise: "local",
  };
}
