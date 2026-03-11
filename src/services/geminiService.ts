// Este serviço foi depreciado em favor do templateService para garantir
// que as mensagens sejam exatas e não geradas por IA.
// Mantemos o arquivo apenas para evitar erros de importação legados se houver.
import { Stage, Client, GeneratedContent } from "../types.ts";
import { generateTemplateContent } from "./templateService.ts";

export const generateStageContent = async (
  stage: Stage,
  client: Client,
  fieldValues: Record<string, string> = {}
): Promise<GeneratedContent | null> => {
  // Redireciona para o gerador determinístico
  return generateTemplateContent(stage, client, fieldValues);
};