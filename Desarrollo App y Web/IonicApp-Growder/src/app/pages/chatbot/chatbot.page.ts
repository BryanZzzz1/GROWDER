import { Component, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  links?: { label: string; url: string }[];
}

@Component({
  selector: 'app-chatbot',
  templateUrl: './chatbot.page.html',
  styleUrls: ['./chatbot.page.scss'],
})
export class ChatbotPage {
  @ViewChild('scrollArea') scrollArea?: ElementRef<HTMLElement>;

  mensajes: ChatMsg[] = [];
  texto = '';
  cargando = false;

  readonly acciones = [
    { icon: 'cube-outline', label: 'Rastrear pedido', msg: '¿Cómo puedo rastrear mi pedido?' },
    { icon: 'bicycle-outline', label: 'Envíos', msg: '¿Cuánto cuesta y cuánto demora el envío?' },
    { icon: 'cafe-outline', label: 'Ver mates', msg: '¿Qué mates tienen disponibles y a qué precio?' },
    { icon: 'sparkles-outline', label: 'Curar mi mate', msg: '¿Cómo curo mi mate de calabaza?' },
  ];

  private conversacionId: string;

  constructor(private supabase: SupabaseService, private router: Router) {
    let id = '';
    try { id = sessionStorage.getItem('sumate_chat_conv_id') || ''; } catch {}
    if (!id) {
      id = (crypto as any)?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      try { sessionStorage.setItem('sumate_chat_conv_id', id); } catch {}
    }
    this.conversacionId = id;
  }

  async enviar(textoRapido?: string) {
    const contenido = (textoRapido ?? this.texto).trim();
    if (!contenido || this.cargando) return;

    this.mensajes.push({ role: 'user', content: contenido });
    this.texto = '';
    this.cargando = true;
    this.scrollAlFinal();

    try {
      const { data, error } = await this.supabase.client.functions.invoke('chat-cliente', {
        body: {
          messages: this.mensajes.map(m => ({ role: m.role, content: m.content })),
          conversacionId: this.conversacionId,
        },
      });
      if (error || !data?.respuesta) throw error || new Error('Sin respuesta');
      this.mensajes.push(this.parsear(data.respuesta));
    } catch (e) {
      console.error('[Chatbot] Error:', e);
      this.mensajes.push({
        role: 'assistant',
        content: 'Ups, no pude responder en este momento. Revisa tu conexión e inténtalo de nuevo en unos segundos.',
      });
    } finally {
      this.cargando = false;
      this.scrollAlFinal();
    }
  }

  /** Extrae enlaces [texto](/ruta) como botones y limpia negritas simples. */
  private parsear(texto: string): ChatMsg {
    const links: { label: string; url: string }[] = [];
    const limpio = texto
      .replace(/\[([^\]]+)\]\((\/[^)\s]*)\)/g, (_m, label, url) => {
        const ruta = url.startsWith('/mis-compras') ? '/historial-compras' : url;
        links.push({ label, url: ruta });
        return '';
      })
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .trim();
    return { role: 'assistant', content: limpio, links };
  }

  irA(url: string) {
    this.router.navigateByUrl(url);
  }

  volver() {
    this.router.navigate(['/ayuda']);
  }

  nuevaConversacion() {
    this.mensajes = [];
  }

  private scrollAlFinal() {
    setTimeout(() => {
      const el = this.scrollArea?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, 50);
  }
}
