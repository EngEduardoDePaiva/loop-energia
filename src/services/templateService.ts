import { Stage, Client, GeneratedContent } from '../types.ts';

export const generateTemplateContent = (
  stage: Stage,
  client: Client,
  inputValues: Record<string, string> = {}
): GeneratedContent => {
  let body = stage.template || '';

  // 1. Substituição Padrão: Nome do Cliente
  body = body.replace(/\[nome do cliente\]/gi, client.name);

  // 2. Substituição de Campos Dinâmicos (priorizando novos inputs, depois dados salvos)
  const combinedData = { ...client.stageData, ...inputValues };
  
  Object.entries(combinedData).forEach(([key, value]) => {
    if (typeof value === 'string') {
        const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\[${escapedKey}\\]`, 'gi');
        body = body.replace(regex, value);
    }
  });

  // 3. Definição do Assunto
  let subject = `Loop Energia - Atualização (${stage.title})`;
  if (stage.id === '1') subject = `Bem-vindo à Loop Energia! 🌞`;
  if (stage.id === '3') subject = `Material Faturado e Previsão 🚚`;
  if (stage.id === '6.2') subject = `Vistoria Concluída! 🎉`;

  return {
    subject,
    body,
    tips: []
  };
};

export const getMissingVariables = (text: string): string[] => {
  const matches = text.match(/\[(.*?)\]/g);
  if (!matches) return [];
  return Array.from(new Set(matches.map(m => m.replace(/[\[\]]/g, ''))));
};