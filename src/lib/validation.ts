/**
 * Utilitários centralizados de formatação (máscaras) e validação de dados
 * para formulários do ConnectPet.
 */

// ============================================================================
// Formatação e Máscaras
// ============================================================================

/**
 * Aplica máscara de CPF: 000.000.000-00
 * Limita a entrada estritamente a 11 dígitos numéricos.
 */
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
}

/**
 * Aplica máscara de CNPJ: 00.000.000/0000-00
 * Limita a entrada estritamente a 14 dígitos numéricos.
 */
export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 2) return digits;
  if (digits.length <= 5) return `${digits.slice(0, 2)}.${digits.slice(2)}`;
  if (digits.length <= 8) return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5)}`;
  if (digits.length <= 12) {
    return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8)}`;
  }
  return `${digits.slice(0, 2)}.${digits.slice(2, 5)}.${digits.slice(5, 8)}/${digits.slice(8, 12)}-${digits.slice(12, 14)}`;
}

/**
 * Formata dinamicamente como CPF (até 11 dígitos) ou CNPJ (acima de 11 até 14 dígitos).
 */
export function formatDocument(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 14);
  if (digits.length <= 11) {
    return formatCPF(digits);
  }
  return formatCNPJ(digits);
}

/**
 * Aplica máscara de telefone brasileiro: (00) 0000-0000 ou (00) 00000-0000
 * Limita a 11 dígitos numéricos.
 */
export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

/**
 * Formatação básica de RG (até 9 caracteres alfanuméricos/dígitos).
 */
export function formatRG(value: string): string {
  const clean = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 9);
  if (clean.length <= 2) return clean;
  if (clean.length <= 5) return `${clean.slice(0, 2)}.${clean.slice(2)}`;
  if (clean.length <= 8) return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5)}`;
  return `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}-${clean.slice(8, 9)}`;
}

// ============================================================================
// Validações Matemáticas e Regras de Negócio
// ============================================================================

/**
 * Validação matemática dos dígitos verificadores do CPF.
 */
export function isValidCPF(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, "");
  if (clean.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(clean)) return false;

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i);
  }
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(clean.charAt(9), 10)) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i);
  }
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(clean.charAt(10), 10);
}

/**
 * Validação com feedback detalhado para CPF.
 */
export function validateCPF(cpf: string, required = true): { valid: boolean; error?: string } {
  const clean = cpf.replace(/\D/g, "");
  if (!clean) {
    return required ? { valid: false, error: "CPF é obrigatório." } : { valid: true };
  }
  if (clean.length < 11) {
    return { valid: false, error: "CPF incompleto. Deve conter 11 dígitos (000.000.000-00)." };
  }
  if (!isValidCPF(clean)) {
    return { valid: false, error: "CPF inválido. Verifique os dígitos informados." };
  }
  return { valid: true };
}

/**
 * Validação matemática dos dígitos verificadores do CNPJ (algoritmo Módulo 11).
 */
export function isValidCNPJ(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, "");
  if (clean.length !== 14) return false;

  // Rejeita sequências de dígitos iguais (ex: 00000000000000, 11111111111111)
  if (/^(\d)\1{13}$/.test(clean)) return false;

  // 1º Dígito Verificador
  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum1 = 0;
  for (let i = 0; i < 12; i++) {
    sum1 += parseInt(clean.charAt(i), 10) * weights1[i];
  }
  const rem1 = sum1 % 11;
  const digit1 = rem1 < 2 ? 0 : 11 - rem1;
  if (digit1 !== parseInt(clean.charAt(12), 10)) return false;

  // 2º Dígito Verificador
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  let sum2 = 0;
  for (let i = 0; i < 13; i++) {
    sum2 += parseInt(clean.charAt(i), 10) * weights2[i];
  }
  const rem2 = sum2 % 11;
  const digit2 = rem2 < 2 ? 0 : 11 - rem2;
  return digit2 === parseInt(clean.charAt(13), 10);
}

/**
 * Validação com feedback detalhado para CNPJ.
 */
export function validateCNPJ(cnpj: string, required = true): { valid: boolean; error?: string } {
  const clean = cnpj.replace(/\D/g, "");
  if (!clean) {
    return required ? { valid: false, error: "CNPJ é obrigatório." } : { valid: true };
  }
  if (clean.length < 14) {
    return { valid: false, error: `CNPJ incompleto (${clean.length}/14 dígitos). Padrão: 00.000.000/0000-00.` };
  }
  if (!isValidCNPJ(clean)) {
    return { valid: false, error: "CNPJ inválido. Confira os números e os dígitos verificadores." };
  }
  return { valid: true };
}

/**
 * Validação para documento que pode ser CPF (11 dígitos) ou CNPJ (14 dígitos).
 */
export function isValidDocument(doc: string): boolean {
  const clean = doc.replace(/\D/g, "");
  if (clean.length === 11) return isValidCPF(clean);
  if (clean.length === 14) return isValidCNPJ(clean);
  return false;
}

/**
 * Validação com feedback para documento flexível (CPF ou CNPJ).
 */
export function validateDocument(doc: string, required = true): { valid: boolean; error?: string } {
  const clean = doc.replace(/\D/g, "");
  if (!clean) {
    return required ? { valid: false, error: "Documento (CPF ou CNPJ) é obrigatório." } : { valid: true };
  }
  if (clean.length <= 11) {
    if (clean.length < 11) {
      return { valid: false, error: "Documento incompleto. Digite um CPF (11 dígitos) ou CNPJ (14 dígitos)." };
    }
    return isValidCPF(clean)
      ? { valid: true }
      : { valid: false, error: "CPF inválido. Verifique os números informados." };
  }
  if (clean.length < 14) {
    return { valid: false, error: `CNPJ incompleto (${clean.length}/14 dígitos). Padrão: 00.000.000/0000-00.` };
  }
  return isValidCNPJ(clean)
    ? { valid: true }
    : { valid: false, error: "CNPJ inválido. Verifique os dígitos verificadores." };
}

/**
 * Validação de telefone celular ou fixo brasileiro.
 * Exige DDD válido entre 11 e 99 e 10 a 11 dígitos numéricos.
 */
export function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return false;
  const ddd = parseInt(digits.slice(0, 2), 10);
  if (ddd < 11 || ddd > 99) return false;
  // Se for celular (11 dígitos), deve iniciar com o dígito 9
  if (digits.length === 11 && digits.charAt(2) !== "9") return false;
  return true;
}

export function validatePhone(phone: string, required = true): { valid: boolean; error?: string } {
  const digits = phone.replace(/\D/g, "");
  if (!digits) {
    return required ? { valid: false, error: "Telefone/WhatsApp é obrigatório." } : { valid: true };
  }
  if (digits.length < 10) {
    return { valid: false, error: "Telefone incompleto. Informe DDD e número (Ex: (11) 98765-4321)." };
  }
  if (!isValidPhone(phone)) {
    return { valid: false, error: "Número de telefone inválido. Verifique o DDD e os dígitos." };
  }
  return { valid: true };
}

/**
 * Validação de formato de endereço de e-mail.
 */
export function isValidEmail(email: string): boolean {
  const clean = email.trim();
  if (clean.length < 5 || clean.length > 100) return false;
  return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(clean);
}

export function validateEmail(email: string, required = true): { valid: boolean; error?: string } {
  const clean = email.trim();
  if (!clean) {
    return required ? { valid: false, error: "E-mail é obrigatório." } : { valid: true };
  }
  if (!isValidEmail(clean)) {
    return { valid: false, error: "Endereço de e-mail inválido. Utilize o formato nome@dominio.com." };
  }
  return { valid: true };
}

/**
 * Validação de data de nascimento com limite de idade.
 */
export function isValidBirthDate(dateStr: string, minAge = 18, maxAge = 120): { valid: boolean; error?: string } {
  if (!dateStr) return { valid: false, error: "Data de nascimento é obrigatória." };
  const birth = new Date(dateStr + "T00:00:00");
  if (isNaN(birth.getTime())) return { valid: false, error: "Data de nascimento inválida." };

  const today = new Date();
  if (birth > today) return { valid: false, error: "A data de nascimento não pode estar no futuro." };

  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }

  if (age < minAge) {
    return { valid: false, error: `É necessário ter no mínimo ${minAge} anos para se cadastrar.` };
  }
  if (age > maxAge) {
    return { valid: false, error: "Data de nascimento fora do intervalo válido." };
  }

  return { valid: true };
}

/**
 * Validação de nome completo (pelo menos duas palavras com mais de 2 letras).
 */
export function validateFullName(name: string, fieldLabel = "Nome completo"): { valid: boolean; error?: string } {
  const trimmed = name.trim();
  if (!trimmed) {
    return { valid: false, error: `${fieldLabel} é obrigatório.` };
  }
  if (trimmed.length < 3) {
    return { valid: false, error: `${fieldLabel} deve conter pelo menos 3 caracteres.` };
  }
  const parts = trimmed.split(/\s+/).filter(Boolean);
  if (parts.length < 2) {
    return { valid: false, error: `Por favor, informe ${fieldLabel.toLowerCase()} (nome e sobrenome).` };
  }
  return { valid: true };
}
