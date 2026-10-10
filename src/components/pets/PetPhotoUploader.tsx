"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, ImagePlus, Loader2, RefreshCw, UploadCloud, X } from "lucide-react";
import {
  FotoPet,
  MAX_FOTOS_PET,
  TAMANHO_MAX_FOTO_BYTES,
  TIPOS_FOTO_ACEITOS,
  novoIdFoto,
  validarFotoPet
} from "@/lib/petPhotos";

interface PetPhotoUploaderProps {
  fotos: FotoPet[];
  onChange: React.Dispatch<React.SetStateAction<FotoPet[]>>;
  disabled?: boolean;
  maxFotos?: number;
}

function urlDaFoto(foto: FotoPet) {
  return foto.tipo === "remota" ? foto.url : foto.previewUrl;
}

export function PetPhotoUploader({ fotos, onChange, disabled = false, maxFotos = MAX_FOTOS_PET }: PetPhotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const substituirRef = useRef<HTMLInputElement>(null);
  const fotosRef = useRef(fotos);
  const [idParaSubstituir, setIdParaSubstituir] = useState<string | null>(null);
  const [erros, setErros] = useState<string[]>([]);
  const [arrastando, setArrastando] = useState(false);

  useEffect(() => {
    fotosRef.current = fotos;
  }, [fotos]);

  // Libera as URLs temporárias de pré-visualização ao sair da tela.
  useEffect(() => {
    return () => {
      fotosRef.current.forEach((f) => {
        if (f.tipo === "local") URL.revokeObjectURL(f.previewUrl);
      });
    };
  }, []);

  const criarFotoLocal = (arquivo: File): FotoPet => ({
    id: novoIdFoto(),
    tipo: "local",
    arquivo,
    previewUrl: URL.createObjectURL(arquivo),
    status: "pendente"
  });

  const adicionarArquivos = useCallback(
    async (lista: FileList | File[]) => {
      const arquivos = Array.from(lista);
      if (arquivos.length === 0) return;

      const mensagens: string[] = [];
      const vagas = maxFotos - fotosRef.current.length;
      if (vagas <= 0) {
        setErros([`Limite de ${maxFotos} fotos atingido. Remova uma foto para adicionar outra.`]);
        return;
      }

      const validos: File[] = [];
      for (const arquivo of arquivos) {
        const erro = await validarFotoPet(arquivo);
        if (erro) mensagens.push(erro);
        else validos.push(arquivo);
      }

      const aceitos = validos.slice(0, vagas);
      if (validos.length > vagas) {
        mensagens.push(`Limite de ${maxFotos} fotos: ${validos.length - vagas} arquivo(s) não foram adicionados.`);
      }

      if (aceitos.length > 0) {
        const novas = aceitos.map(criarFotoLocal);
        onChange((anteriores) => [...anteriores, ...novas].slice(0, maxFotos));
      }
      setErros(mensagens);
    },
    [maxFotos, onChange]
  );

  const substituirArquivo = useCallback(
    async (id: string, arquivo: File) => {
      const erro = await validarFotoPet(arquivo);
      if (erro) {
        setErros([erro]);
        return;
      }
      const nova = criarFotoLocal(arquivo);
      onChange((anteriores) =>
        anteriores.map((f) => {
          if (f.id !== id) return f;
          if (f.tipo === "local") URL.revokeObjectURL(f.previewUrl);
          return nova;
        })
      );
      setErros([]);
    },
    [onChange]
  );

  const remover = (id: string) => {
    onChange((anteriores) => {
      const alvo = anteriores.find((f) => f.id === id);
      if (alvo?.tipo === "local") URL.revokeObjectURL(alvo.previewUrl);
      return anteriores.filter((f) => f.id !== id);
    });
    setErros([]);
  };

  const aoSoltar = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    if (disabled) return;
    void adicionarArquivos(e.dataTransfer.files);
  };

  const cheio = fotos.length >= maxFotos;
  const limiteMb = TAMANHO_MAX_FOTO_BYTES / 1024 / 1024;
  const accept = TIPOS_FOTO_ACEITOS.join(",");

  return (
    <div className="space-y-3">
      <input
        ref={inputRef}
        id="pet-photo-input"
        type="file"
        accept={accept}
        multiple
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          if (e.target.files) void adicionarArquivos(e.target.files);
          e.target.value = "";
        }}
      />
      <input
        ref={substituirRef}
        id="pet-photo-replace-input"
        type="file"
        accept={accept}
        className="sr-only"
        tabIndex={-1}
        disabled={disabled}
        onChange={(e) => {
          const arquivo = e.target.files?.[0];
          if (arquivo && idParaSubstituir) void substituirArquivo(idParaSubstituir, arquivo);
          setIdParaSubstituir(null);
          e.target.value = "";
        }}
      />

      {!cheio && (
        <button
          type="button"
          id="pet-photo-dropzone"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled) setArrastando(true);
          }}
          onDragLeave={() => setArrastando(false)}
          onDrop={aoSoltar}
          className={`group w-full min-h-[44px] rounded-2xl border-2 border-dashed p-5 sm:p-6 flex flex-col items-center justify-center gap-2 text-center transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60 disabled:cursor-not-allowed ${
            arrastando
              ? "border-primary bg-primary/10"
              : "border-border bg-secondary/30 hover:border-primary/60 hover:bg-primary/5"
          }`}
        >
          <span className="w-11 h-11 rounded-full bg-primary/10 text-primary flex items-center justify-center transition-transform group-hover:scale-110">
            <UploadCloud className="w-5 h-5" />
          </span>
          <span className="text-sm font-semibold text-foreground">
            Toque para escolher fotos ou arraste aqui
          </span>
          <span className="text-xs text-muted-foreground">
            JPG, PNG ou WebP · até {limiteMb} MB cada · {fotos.length}/{maxFotos} fotos
          </span>
        </button>
      )}

      {erros.length > 0 && (
        <div
          role="alert"
          className="flex gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-700 dark:text-rose-300"
        >
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <ul className="space-y-0.5 min-w-0 break-words">
            {erros.map((erro, i) => (
              <li key={i}>{erro}</li>
            ))}
          </ul>
        </div>
      )}

      {fotos.length > 0 && (
        <ul className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {fotos.map((foto, indice) => (
            <li
              key={foto.id}
              className="relative aspect-square rounded-2xl overflow-hidden border border-border bg-secondary shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={urlDaFoto(foto)}
                alt={`Foto ${indice + 1} do animal`}
                className="absolute inset-0 w-full h-full object-cover"
              />

              {indice === 0 && (
                <span className="absolute left-2 top-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground shadow">
                  Principal
                </span>
              )}
              {foto.tipo === "local" && foto.status !== "erro" && (
                <span className="absolute left-2 bottom-2 rounded-full bg-black/70 px-2 py-0.5 text-[10px] font-semibold text-white">
                  {foto.status === "enviando" ? "Enviando..." : "Novo"}
                </span>
              )}

              {foto.tipo === "local" && foto.status === "enviando" && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="w-7 h-7 animate-spin text-white" />
                </div>
              )}
              {foto.tipo === "local" && foto.status === "erro" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-rose-950/70 p-2 text-center text-white">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-[10px] leading-tight line-clamp-4">
                    {foto.mensagemErro || "Falha no envio"}
                  </span>
                </div>
              )}

              {!disabled && (
                <>
                  <button
                    type="button"
                    onClick={() => remover(foto.id)}
                    aria-label={`Remover foto ${indice + 1}`}
                    className="absolute right-0 top-0 flex min-h-[44px] min-w-[44px] items-center justify-center"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-rose-600">
                      <X className="w-4 h-4" />
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIdParaSubstituir(foto.id);
                      substituirRef.current?.click();
                    }}
                    aria-label={`Substituir foto ${indice + 1}`}
                    className="absolute right-0 bottom-0 flex min-h-[44px] min-w-[44px] items-center justify-center"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-black/70 text-white transition-colors hover:bg-primary">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}

      {fotos.length === 0 && (
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <ImagePlus className="w-3.5 h-3.5" /> A primeira foto será a imagem principal nos cards e no catálogo.
        </p>
      )}
    </div>
  );
}
