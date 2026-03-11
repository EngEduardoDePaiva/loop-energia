import { Stage } from './types.ts';
import { 
  Handshake, 
  FileText, 
  Truck, 
  CheckCircle2, 
  CalendarClock, 
  ClipboardList, 
  Wrench, 
  Users, 
  Flag,
  Trophy
} from 'lucide-react';

export const STAGES: Stage[] = [
  {
    id: '1',
    stepNumber: '1',
    title: 'Boas-Vindas',
    description: 'Recepção inicial e canais de suporte.',
    category: 'PRE',
    requiredFields: [],
    template: `🌞 Bem-vindo à Loop Energia!
Olá [nome do cliente]! 👋
É um prazer ter você com a gente! 🚀
Este número é o canal oficial de suporte técnico da Loop Energia, e estamos à disposição para te ajudar com tudo o que precisar sobre seu sistema e nossas soluções energéticas. ⚡
Conte conosco para levar mais eficiência e economia à sua energia! 💡
Equipe Loop Energia ⚙`
  },
  {
    id: '2',
    stepNumber: '2',
    title: 'Pedido Realizado',
    description: 'Pedido feito, aguardando faturamento.',
    category: 'PRE',
    requiredFields: [],
    template: `Olá, [nome do cliente]! 🌞
Tudo bem? Passando pra te manter informada sobre o andamento do seu projeto. O pedido dos materiais já foi realizado e agora estamos aguardando o faturamento junto ao fornecedor 🧾
Assim que o processo for concluído, entraremos em contato novamente para te atualizar sobre o envio e o recebimento dos equipamentos.
Seguimos acompanhando tudo de perto para garantir que sua usina seja entregue com toda a qualidade e agilidade que a Loop Energia preza! ⚡
Conte sempre conosco 💙
Equipe Loop Energia ⚙`
  },
  {
    id: '3',
    stepNumber: '3',
    title: 'Faturamento e Entrega',
    description: 'Material faturado e previsão de entrega.',
    category: 'EXECUTION',
    requiredFields: ['data prevista'],
    template: `Olá, [nome do cliente]! 🌞
Temos uma ótima notícia! O faturamento do seu pedido foi concluído ✅
Agora, o seu material está a caminho para o endereço cadastrado.
A previsão da entrega dos materiais é para o dia [data prevista].
A equipe da Loop Energia segue acompanhando cada etapa para garantir que tudo ocorra com segurança e qualidade ⚙
Equipe Loop Energia ⚙`
  },
  {
    id: '4',
    stepNumber: '4',
    title: 'Homologação',
    description: 'Projeto submetido à concessionária.',
    category: 'EXECUTION',
    requiredFields: [],
    template: `Olá, [nome do cliente]! 🌞
Seguimos avançando com o seu projeto! 🚀
Informamos que o projeto da sua usina solar já foi submetido à análise da concessionária de energia. ⚙
Essa etapa é essencial para garantir que tudo esteja de acordo com as normas técnicas e de segurança da rede elétrica.
⏳ O prazo de resposta da concessionária é de aproximadamente 15 dias, mas nossa equipe acompanha todo o processo de perto e te manterá informado sobre qualquer atualização.
A Loop Energia continua cuidando de cada detalhe para que sua usina esteja pronta o quanto antes. 💙
Equipe Loop Energia ⚙`
  },
  {
    id: '5',
    stepNumber: '5',
    title: 'Agendamento',
    description: 'Aprovação e preparação para instalação.',
    category: 'EXECUTION',
    requiredFields: [],
    template: `Olá, [nome do cliente]! 🌞
Temos uma excelente notícia! O seu projeto foi aprovado pela concessionária, e agora estamos prontos para seguir para a instalação da sua usina solar ⚡
Nossa equipe técnica já está organizando os detalhes e o agendamento da instalação.
Em breve, nosso gestor responsável pela execução entrará em contato para confirmar a data e o horário que melhor se adequem à sua disponibilidade 🗓
A Loop Energia agradece a confiança e reforça o compromisso em entregar uma instalação de qualidade, segura e dentro dos prazos. 💙
Equipe Loop Energia ⚙`
  },
  {
    id: '6.1',
    stepNumber: '6.1',
    title: 'Aviso Vistoria',
    description: 'Instalação finalizada, aguardando vistoria.',
    category: 'POST',
    requiredFields: [],
    template: `Olá, [nome do cliente]! ☀
Tudo pronto por aqui! Agora que a sua usina já está instalada, a próxima etapa é a vistoria da concessionária. ⚡
Essa vistoria serve para garantir que todo o sistema esteja dentro das normas técnicas e pronto para ser conectado à rede.
Assim que a concessionária definir a data, nossa equipe entrará em contato para te avisar com antecedência.
Seguimos acompanhando tudo de perto para que sua usina comece a gerar energia o quanto antes! 💙
Equipe Loop Energia ⚙`
  },
  {
    id: '6.2',
    stepNumber: '6.2',
    title: 'Pós Vistoria',
    description: 'Vistoria concluída com sucesso.',
    category: 'POST',
    requiredFields: [],
    template: `Olá, [nome do cliente]! ☀
Temos uma ótima notícia! A vistoria da sua usina foi concluída com sucesso e agora o sistema está pronto para iniciar a geração de energia solar! ⚡
Parabéns por essa conquista — é um passo importante rumo à economia e sustentabilidade! 🌱
Durante esta primeira semana, vamos acompanhar o desempenho da sua usina de perto para garantir que tudo funcione perfeitamente.
Em breve entraremos em contato novamente para te passar um parecer sobre o funcionamento e marcar a reunião final de acompanhamento. 💙
Equipe Loop Energia ⚙`
  },
  {
    id: '6.3',
    stepNumber: '6.3',
    title: 'Reunião Final',
    description: 'Agendamento de reunião de encerramento.',
    category: 'POST',
    requiredFields: [],
    template: `Olá, [nome do cliente]! ☀
Tudo bem? Passando pra te atualizar sobre o funcionamento da sua usina solar! ⚡
Durante esta primeira semana, acompanhamos o desempenho do sistema e verificamos que tudo está operando normalmente, dentro dos padrões esperados.

Agora queremos marcar uma reunião final de acompanhamento, onde vamos:
🔹 Te auxiliar na leitura da conta de energia com a usina já em operação;
🔹 Explicar como funcionam as garantias dos módulos, do inversor e também a garantia de serviço da Loop;
🔹 E apresentar uma oportunidade exclusiva do nosso plano de assinatura Standard, pensado pra manter sua usina com o melhor desempenho e suporte contínuo. 💙

Qual seria o melhor dia e horário pra realizarmos essa reunião? 📅
A equipe da Loop Energia segue à disposição pra garantir que você tenha a melhor experiência com sua usina! ⚙
Equipe Loop Energia ⚙`
  },
  {
    id: '6.4',
    stepNumber: '6.4',
    title: 'Encerramento',
    description: 'Agradecimento e conclusão.',
    category: 'POST',
    requiredFields: [],
    template: `Olá, [nome do cliente]! 🌞
Queremos agradecer por toda a parceria e confiança durante esse processo. 💙
Sua usina já está gerando energia limpa e sustentável, e é um orgulho pra Loop Energia ter feito parte dessa conquista! ⚡
Continuamos à disposição sempre que precisar — e lembra: estamos aqui pra garantir o melhor desempenho do seu sistema, sempre!
Equipe Loop Energia ⚙`
  },
  {
    id: '7',
    stepNumber: '7',
    title: 'Entregue',
    description: 'Projeto concluído com sucesso.',
    category: 'POST',
    requiredFields: [],
    template: undefined
  }
];

export const STEP_ICONS: Record<string, any> = {
  '1': Handshake,
  '2': FileText,
  '3': Truck,
  '4': CheckCircle2,
  '5': CalendarClock,
  '6.1': ClipboardList,
  '6.2': Wrench,
  '6.3': Users,
  '6.4': Flag,
  '7': Trophy,
};