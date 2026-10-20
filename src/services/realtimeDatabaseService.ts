import { ref, set, onValue, get, serverTimestamp } from 'firebase/database';
import { auth, rtdb } from '../lib/firebase';
import { currentFirebaseTenantId } from '../lib/firebaseTenant';

/** RTDB paths and security rules are scoped to the authenticated company. */
function tenantPath(segment: 'message' | 'terminals', id?: string) {
  const user = auth.currentUser;
  const companyId = currentFirebaseTenantId();
  if (!user || user.isAnonymous || !companyId) {
    throw new Error('Empresa autenticada não identificada.');
  }
  if (!/^[A-Za-z0-9_-]+$/.test(companyId)) {
    throw new Error('Identificador de empresa inválido.');
  }
  if (id !== undefined && !/^[A-Za-z0-9_-]+$/.test(id)) {
    throw new Error('Identificador de terminal inválido.');
  }
  return `tenants/${companyId}/${segment}${id ? '/' + id : ''}`;
}

export const realtimeDatabaseService = {
  async setMessage(message: string): Promise<boolean> {
    try {
      if (!rtdb) return false;
      await set(ref(rtdb, tenantPath('message')), message);
      return true;
    } catch (error) {
      console.warn('[RTDB] Erro ao gravar mensagem:', error);
      return false;
    }
  },

  async getMessage(): Promise<string | null> {
    try {
      if (!rtdb) return null;
      const snapshot = await get(ref(rtdb, tenantPath('message')));
      return snapshot.exists() ? (snapshot.val() as string) : null;
    } catch (error) {
      console.warn('[RTDB] Erro ao buscar mensagem:', error);
      return null;
    }
  },

  subscribeToMessage(callback: (val: string | null) => void): () => void {
    if (!rtdb) return () => {};
    try {
      return onValue(ref(rtdb, tenantPath('message')), (snapshot) => {
        callback(snapshot.exists() ? (snapshot.val() as string) : null);
      }, (error) => {
        console.warn('[RTDB] Erro no listener:', error);
        callback(null);
      });
    } catch (error) {
      console.warn('[RTDB] Assinatura não autorizada:', error);
      callback(null);
      return () => {};
    }
  },

  async updateCashierStatus(
    terminalId: string,
    status: { isOpen: boolean; operator: string; lastPing?: unknown }
  ): Promise<void> {
    if (!rtdb) return;
    await set(ref(rtdb, tenantPath('terminals', terminalId)), {
      isOpen: status.isOpen,
      operator: status.operator,
      lastPing: serverTimestamp()
    });
  }
};
