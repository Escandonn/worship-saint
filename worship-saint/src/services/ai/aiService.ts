export interface AIServiceConfig {
  name: string;
  description: string;
  headline: string;
  buttonLabel: string;
}

export const iaServiceConfig: AIServiceConfig = {
  name: 'GroqIA',
  description: 'La IA del todo poderoso creada para responder y guiarte con claridad.',
  headline: 'Hola bill cyber, la IA del todo poderoso',
  buttonLabel: 'Abrir IA',
};

export const getAISummary = () => {
  return 'Resolveré todas tus dudas y te ayudaré a guardar este secreto.';
};
