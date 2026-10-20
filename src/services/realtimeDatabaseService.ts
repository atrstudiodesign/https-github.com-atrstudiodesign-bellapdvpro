import { ref, set, onValue, off, get, serverTimestamp } from 'firebase/database';
import { rtdb } from '../lib/firebase';

/**
 * Serviço do Firebase Realtime Database
 * Oferece leitura e escrita em tempo real com baixa latência e suporte offline seguro
 */
export const realtimeDatabaseService = {
  /**
   * Escreve uma mensagem de teste ou status no Realtime Database
   */
  async setMessage(message: string): Promise<boolean> {
    try {
      if (!rtdb) {
        console.warn('[RTDB] Instância do Realtime Database indisponível no projeto.');
        return false;
      }
      const messageRef = ref(rtdb, 'message');
      await set(messageRef, message);
      return true;
    } catch (error) {
      console.warn('[RTDB] Erro ao gravar mensagem:', error);
      return false;
    }
  },

  /**
   * Lê o valor atual da mensagem
   */
  async getMessage(): Promise<string | null> {
    try {
      if (!rtdb) {
        return null;
      }
      const messageRef = ref(rtdb, 'message');
      const snapshot = await get(messageRef);
      return snapshot.exists() ? (snapshot.val() as string) : null;
    } catch (error) {
      console.warn('[RTDB] Erro ao buscar mensagem:', error);
      return null;
    }
  },

  /**
   * Escuta alterações em tempo real na chave 'message'
   */
  subscribeToMessage(callback: (val: string | null) => void): () => void {
    if (!rtdb) {
      return () => {};
    }
    try {
      const messageRef = ref(rtdb, 'message');
      const unsubscribe = onValue(
        messageRef,
        (snapshot) => {
          const val = snapshot.exists() ? (snapshot.val() as string) : null;
          callback(val);
        },
        (error) => {
          console.warn('[RTDB] Erro no listener de mensagem:', error);
        }
      );

      return () => {
        off(messageRef);
      };
    } catch (err) {
      console.warn('[RTDB] Falha ao registrar listener:', err);
      return () => {};
    }
  },

  /**
   * Atualiza o status em tempo real do caixa / operador (estrutura plana desnormalizada)
   */
  async updateCashierStatus(terminalId: string, status: { isOpen: boolean; operator: string; lastPing?: any }): Promise<void> {
    try {
      if (!rtdb) {
        return;
      }
      const statusRef = ref(rtdb, `terminals/${terminalId}`);
      await set(statusRef, {
        ...status,
        lastPing: serverTimestamp()
      });
    } catch (err) {
      console.warn('[RTDB] Erro ao atualizar status do caixa:', err);
    }
  }
};
