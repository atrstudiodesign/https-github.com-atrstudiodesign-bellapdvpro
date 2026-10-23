import React, { useEffect, useRef } from 'react';
import { driver, DriveStep } from 'driver.js';
import 'driver.js/dist/driver.css';
import { useAuthStore } from '../../store/auth';
import { trackEvent } from '../../services/analyticsService';

const TOUR_STORAGE_KEY = 'bella_welcome_tour_completed';

export function startWelcomeTour(force = false) {
  if (typeof window === 'undefined') return;
  if (!force && localStorage.getItem(TOUR_STORAGE_KEY) === 'true') {
    return;
  }
  window.dispatchEvent(new CustomEvent('bella-start-tour', { detail: { force } }));
}

export function WelcomeTour() {
  const { isAuthenticated, user } = useAuthStore();
  const driverInstanceRef = useRef<ReturnType<typeof driver> | null>(null);

  useEffect(() => {
    const steps: DriveStep[] = [
      {
        element: '#tour-welcome-brand',
        popover: {
          title: '✨ Bem-vindo ao BellaPDV Pro!',
          description: 'Seu sistema completo de gestão, frente de caixa e agendamentos. Preparamos este tour guiado de 1 minuto para apresentar as áreas essenciais.',
          side: 'bottom',
          align: 'start'
        }
      },
      {
        element: '#tour-schedule',
        popover: {
          title: '📅 Gestão da Agenda',
          description: 'Organize horários por profissional, controle status de atendimento em tempo real e reduza faltas com agendamento online e lembretes.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#tour-pos',
        popover: {
          title: '⚡ Frente de Caixa (PDV)',
          description: 'Agilize o atendimento com nosso PDV rápido (atalho F2). Abra comandas, receba pagamentos por Pix, cartão ou dinheiro e emita comprovantes na hora.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#tour-clients',
        popover: {
          title: '👥 Clientes & Relacionamento',
          description: 'Acesse o cadastro de clientes, histórico de serviços realizados, prontuários, preferências e programa de pontos/fidelidade.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#tour-finance',
        popover: {
          title: '💰 Caixa & Financeiro',
          description: 'Acompanhe faturamento diário, fluxo de caixa, contas a pagar e cálculo automático de comissões por profissional com total transparência.',
          side: 'right',
          align: 'start'
        }
      },
      {
        element: '#tour-global-search',
        popover: {
          title: '🔍 Busca Global Instantânea',
          description: 'Pressione Ctrl+K (ou ⌘K no Mac) em qualquer tela para localizar clientes, serviços, comandas e módulos imediatamente.',
          side: 'bottom',
          align: 'center'
        }
      },
      {
        element: '#bella-ai-floating-trigger',
        popover: {
          title: '🤖 Assistente Bella IA',
          description: 'Acesse automações inteligentes de retorno de clientes inativos, criação de campanhas no WhatsApp e suporte operacional com inteligência artificial.',
          side: 'left',
          align: 'end'
        }
      },
      {
        popover: {
          title: '🚀 Pronto para começar!',
          description: 'Seu período de teste está ativo. Comece cadastrando seus serviços ou realizando seu primeiro agendamento agora mesmo. Bom trabalho!',
          side: 'bottom',
          align: 'center'
        }
      }
    ];

    const driverObj = driver({
      showProgress: true,
      animate: true,
      allowClose: true,
      overlayColor: 'rgba(3, 8, 23, 0.85)',
      progressText: 'Passo {{current}} de {{total}}',
      nextBtnText: 'Próximo →',
      prevBtnText: '← Voltar',
      doneBtnText: 'Começar Agora 🚀',
      steps,
      onDestroyStarted: () => {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
        trackEvent('welcome_tour_dismissed', {
          user_id: user?.id,
          role: user?.role
        });
        driverObj.destroy();
      },
      onDestroyed: () => {
        localStorage.setItem(TOUR_STORAGE_KEY, 'true');
        trackEvent('welcome_tour_completed', {
          user_id: user?.id,
          role: user?.role
        });
      }
    });

    driverInstanceRef.current = driverObj;

    const handleStartTour = (e?: Event) => {
      const customEvent = e as CustomEvent<{ force?: boolean }>;
      const isForce = customEvent?.detail?.force === true;
      if (!isForce && localStorage.getItem(TOUR_STORAGE_KEY) === 'true') {
        return;
      }
      trackEvent('welcome_tour_started', {
        user_id: user?.id,
        is_manual: isForce
      });
      // Small timeout to guarantee DOM elements are rendered
      setTimeout(() => {
        const availableSteps = steps.filter((step) => {
          if (!step.element) return true;
          return typeof step.element === 'string' ? !!document.querySelector(step.element) : true;
        });
        if (availableSteps.length > 0) {
          driverObj.setSteps(availableSteps);
          driverObj.drive();
        }
      }, 350);
    };

    window.addEventListener('bella-start-tour', handleStartTour);

    // Auto-launch on first login after authentication is confirmed
    if (isAuthenticated) {
      const alreadyCompleted = localStorage.getItem(TOUR_STORAGE_KEY) === 'true';
      if (!alreadyCompleted) {
        const timer = setTimeout(() => {
          handleStartTour();
        }, 900);
        return () => {
          clearTimeout(timer);
          window.removeEventListener('bella-start-tour', handleStartTour);
        };
      }
    }

    return () => {
      window.removeEventListener('bella-start-tour', handleStartTour);
      if (driverInstanceRef.current?.isActive()) {
        driverInstanceRef.current.destroy();
      }
    };
  }, [isAuthenticated, user?.id, user?.role]);

  return null;
}
