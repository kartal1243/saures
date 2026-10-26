import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  X,
  Play,
  RotateCcw,
} from 'lucide-react';
import type { Appointment, BarberStaff, BarberTimeBlock } from '../../../shared/types';

interface BarberVoiceAssistantProps {
  appointments: Appointment[];
  staffList: BarberStaff[];
  onAddAppointment: (data: Partial<Appointment>) => Promise<void>;
  onUpdateTimeBlock: (date: string, start: string, end: string, reason: string, staffId?: string) => Promise<void>;
  onRemoveTimeBlock: (date: string, hour?: string) => Promise<boolean>;
  onRescheduleAppointment: (customerName: string, newDate: string, newTime: string) => Promise<boolean>;
  onCancelAppointment: (customerName: string) => Promise<boolean>;
  onStaffOffDay: (staffName: string, dayName: string) => Promise<boolean>;
}

const DAYS_MAP: Record<string, number> = {
  pazar: 0,
  pazartesi: 1,
  salı: 2,
  sali: 2,
  çarşamba: 3,
  carsamba: 3,
  perşembe: 4,
  persembe: 4,
  cuma: 5,
  cumartesi: 6,
};

function getNextDayOfWeek(dayIndex: number): string {
  const d = new Date();
  const currentDay = d.getDay();
  let diff = dayIndex - currentDay;
  if (diff <= 0) diff += 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().split('T')[0];
}

function getTomorrowDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function speakText(text: string) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'tr-TR';
  utterance.rate = 1.0;
  window.speechSynthesis.speak(utterance);
}

export const BarberVoiceAssistant: React.FC<BarberVoiceAssistantProps> = ({
  appointments,
  staffList,
  onAddAppointment,
  onUpdateTimeBlock,
  onRescheduleAppointment,
  onCancelAppointment,
  onStaffOffDay,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [lastActionStatus, setLastActionStatus] = useState<'success' | 'error' | null>(null);

  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'tr-TR';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        handleProcessCommand(text);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [appointments, staffList]);

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert('Tarayıcınız ses tanıma (Web Speech API) özelliğini desteklemiyor. Google Chrome veya Safari önerilir.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setTranscript('');
      setLastResponse(null);
      setLastActionStatus(null);
      try {
        recognitionRef.current.start();
      } catch {
        recognitionRef.current.stop();
        setTimeout(() => recognitionRef.current.start(), 200);
      }
    }
  };

  // Sesli Komut Doğal Dil Çözümleyicisi (NLP)
  const handleProcessCommand = async (rawText: string) => {
    const text = rawText.toLowerCase().trim();

    // 1. "Sıradaki müşterim kim?"
    if (text.includes('sıradaki') || text.includes('siradaki')) {
      const today = getTodayDate();
      const nowMin = new Date().getHours() * 60 + new Date().getMinutes();

      const upcoming = appointments
        .filter((a) => a.appointmentDate === today && a.status !== 'tamamlandi' && a.status !== 'iptal')
        .sort((a, b) => {
          const [hA, mA] = a.timeSlot.split(':').map(Number);
          const [hB, mB] = b.timeSlot.split(':').map(Number);
          return hA * 60 + mA - (hB * 60 + mB);
        })
        .find((a) => {
          const [h, m] = a.timeSlot.split(':').map(Number);
          return h * 60 + m >= nowMin - 15;
        });

      if (upcoming) {
        const resp = `Sıradaki müşteriniz saat ${upcoming.timeSlot}'te ${upcoming.serviceName} için ${upcoming.customerName}.`;
        setLastResponse(resp);
        setLastActionStatus('success');
        speakText(resp);
      } else {
        const resp = 'Bugün için bekleyen başka randevunuz görünmüyor.';
        setLastResponse(resp);
        setLastActionStatus('success');
        speakText(resp);
      }
      return;
    }

    // 2. "... sonrasını kapat" (örn: "Bugün 5'ten sonrasını kapat", "Bugün 17'den sonrasını kapat")
    if (text.includes('kapat') && !text.includes('aç') && !text.includes('ac')) {
      let closeHour = '17:00';
      const matchHour = text.match(/(\d{1,2})/);
      if (matchHour) {
        let num = parseInt(matchHour[1], 10);
        if (num < 8) num += 12; // 5 -> 17
        closeHour = `${String(num).padStart(2, '0')}:00`;
      }

      await onUpdateTimeBlock(getTodayDate(), closeHour, '21:00', 'Sesli Komut ile Kapatıldı');
      const resp = `Bugün saat ${closeHour}'den sonrası randevulara kapatıldı.`;
      setLastResponse(resp);
      setLastActionStatus('success');
      speakText(resp);
      return;
    }

    // 2.1 "... sonrasını aç / saati aç / molayı kaldır" (örn: "Bugün 5'ten sonrasını aç", "17'den sonrasını aç", "molayı kaldır")
    if (
      (text.includes('aç') || text.includes('ac') || text.includes('kaldır') || text.includes('kaldir')) &&
      (text.includes('sonra') || text.includes('mola') || text.includes('saat') || text.includes('blok') || text.includes('kapalı'))
    ) {
      let openHour = '';
      const matchHour = text.match(/(\d{1,2})/);
      if (matchHour) {
        let num = parseInt(matchHour[1], 10);
        if (num < 8) num += 12; // 5 -> 17
        openHour = `${String(num).padStart(2, '0')}:00`;
      }

      let targetDate = getTodayDate();
      if (text.includes('yarın') || text.includes('yarin')) {
        targetDate = getTomorrowDate();
      }

      const ok = await onRemoveTimeBlock(targetDate, openHour);
      if (ok) {
        const resp = openHour
          ? `${targetDate === getTodayDate() ? 'Bugün' : 'Yarın'} saat ${openHour}'den sonrası tekrar randevulara açıldı.`
          : 'Kapatılan saatler ve molalar tekrar randevulara açıldı.';
        setLastResponse(resp);
        setLastActionStatus('success');
        speakText(resp);
      } else {
        const resp = 'Açılacak kapalı saat veya mola bulunamadı.';
        setLastResponse(resp);
        setLastActionStatus('error');
        speakText(resp);
      }
      return;
    }

    // 3. "... randevusunu yarına / saate al / ertele" (örn: "Ahmet'in randevusunu yarın 4'e al")
    if (text.includes('al') || text.includes('ertele') || text.includes('taşı') || text.includes('tasi')) {
      const matchName = text.match(/([a-zçğıöşü]+)(?:'in|'ın|'ün|'un|'e|'a)?\s+randevus/i);
      const custName = matchName ? matchName[1] : text.split(' ')[0];

      let targetDate = getTodayDate();
      if (text.includes('yarın') || text.includes('yarin')) {
        targetDate = getTomorrowDate();
      }

      let targetTime = '16:00';
      const matchTime = text.match(/(\d{1,2})(?::(\d{2}))?/);
      if (matchTime) {
        let h = parseInt(matchTime[1], 10);
        if (h < 8) h += 12; // 4 -> 16
        const m = matchTime[2] || '00';
        targetTime = `${String(h).padStart(2, '0')}:${m}`;
      }

      const success = await onRescheduleAppointment(custName, targetDate, targetTime);
      if (success) {
        const resp = `${custName} adlı müşterinin randevusu ${targetDate === getTomorrowDate() ? 'yarın' : 'seçilen güne'} saat ${targetTime}'e ertelendi.`;
        setLastResponse(resp);
        setLastActionStatus('success');
        speakText(resp);
      } else {
        const resp = `${custName} adına kayıtlı randevu bulunamadı.`;
        setLastResponse(resp);
        setLastActionStatus('error');
        speakText(resp);
      }
      return;
    }

    // 4. "... izin ver" (örn: "Emre'ye perşembe izin ver")
    if (text.includes('izin')) {
      const words = text.split(' ');
      let staffName = '';
      let dayName = '';

      for (const w of words) {
        if (DAYS_MAP[w] !== undefined) dayName = w;
        for (const st of staffList) {
          if (w.includes(st.name.toLowerCase().split(' ')[0])) {
            staffName = st.name;
          }
        }
      }

      if (staffName && dayName) {
        await onStaffOffDay(staffName, dayName);
        const resp = `${staffName} için ${dayName} günü izin olarak tanımlandı.`;
        setLastResponse(resp);
        setLastActionStatus('success');
        speakText(resp);
      } else {
        const resp = 'Personel veya izin günü tam anlaşılamadı. Lütfen örneğin "Eren\'e perşembe izin ver" deyiniz.';
        setLastResponse(resp);
        setLastActionStatus('error');
        speakText(resp);
      }
      return;
    }

    // 5. "... randevusunu iptal et / sil" (örn: "Mehmet'in randevusunu iptal et")
    if (text.includes('iptal') || text.includes('sil')) {
      const words = text.split(' ');
      const candidateName = words[0].replace(/'in|'ın|'ün|'un/g, '');
      const ok = await onCancelAppointment(candidateName);
      if (ok) {
        const resp = `${candidateName} randevusu başarıyla iptal edildi.`;
        setLastResponse(resp);
        setLastActionStatus('success');
        speakText(resp);
      } else {
        const resp = `${candidateName} için aktif randevu bulunamadı.`;
        setLastResponse(resp);
        setLastActionStatus('error');
        speakText(resp);
      }
      return;
    }

    // 6. Randevu Ekleme (örn: "Cuma 14:00 Mehmet saç kesimi", "Yarın 15:30 Ali sakal")
    let targetDate = getTodayDate();
    let targetTime = '14:00';
    let customerName = 'Müşteri';
    let serviceName = 'Saç Kesimi';

    // Gün algılama
    for (const [dName, dIdx] of Object.entries(DAYS_MAP)) {
      if (text.includes(dName)) {
        targetDate = getNextDayOfWeek(dIdx);
        break;
      }
    }
    if (text.includes('yarın') || text.includes('yarin')) {
      targetDate = getTomorrowDate();
    }

    // Saat algılama (örn: 14:00 veya 14 veya 2'de)
    const timeMatch = text.match(/(\d{1,2})[:.]?(\d{2})?/);
    if (timeMatch) {
      let hh = parseInt(timeMatch[1], 10);
      const mm = timeMatch[2] || '00';
      if (hh < 8 && !text.includes('sabah')) hh += 12;
      targetTime = `${String(hh).padStart(2, '0')}:${mm}`;
    }

    // Hizmet algılama
    if (text.includes('sakal')) serviceName = 'Sakal Tıraşı';
    else if (text.includes('damat')) serviceName = 'VIP Damat Paketi';
    else if (text.includes('maske') || text.includes('cilt')) serviceName = 'Cilt Maskesi';
    else if (text.includes('saç') || text.includes('kesim')) serviceName = 'Modern Saç Kesimi';

    // İsim çıkarma: Gün ve saat dışındaki ilk anlamlı kelime
    const tokens = text
      .replace(/cuma|cumartesi|pazar|pazartesi|salı|çarşamba|perşembe|yarın|bugün/g, '')
      .replace(/\d{1,2}[:.]?\d{0,2}/g, '')
      .replace(/saç|sakal|kesimi|tıraşı|paket|randevu|ekle/g, '')
      .trim()
      .split(/\s+/)
      .filter((w) => w.length >= 2);

    if (tokens.length > 0) {
      customerName = tokens[0].charAt(0).toUpperCase() + tokens[0].slice(1);
    }

    await onAddAppointment({
      customerName,
      serviceName,
      appointmentDate: targetDate,
      timeSlot: targetTime,
      price: 350,
      durationMinutes: 30,
      status: 'onayli',
      notes: 'Sesli Asistan ile eklendi',
    });

    const resp = `${customerName} için ${targetDate} saat ${targetTime}'e ${serviceName} randevusu başarıyla oluşturuldu.`;
    setLastResponse(resp);
    setLastActionStatus('success');
    speakText(resp);
  };

  return (
    <>
      {/* Sabit Asistan Butonu (Takvim Üstünde) */}
      <button
        type="button"
        onClick={() => {
          setIsOpen(true);
          toggleListen();
        }}
        className="px-3.5 py-2 rounded-xl bg-linear-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center gap-2 cursor-pointer shadow-md shadow-purple-600/20 active:scale-95 transition-all"
        title="Sesli Komut ile Randevu Ekle / Kapat / Yönet"
      >
        <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
        <Mic className="w-4 h-4" />
        <span>Sesli Asistan</span>
      </button>

      {/* Sesli Asistan Pop-up Modalı */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in">
          <div className="bg-white dark:bg-stone-900 rounded-3xl max-w-md w-full border border-stone-200 dark:border-stone-800 p-6 shadow-2xl space-y-5 text-center relative overflow-hidden">
            {/* Kapat */}
            <button
              type="button"
              onClick={() => {
                if (isListening && recognitionRef.current) recognitionRef.current.stop();
                setIsOpen(false);
              }}
              className="absolute right-4 top-4 p-1.5 rounded-xl bg-stone-100 dark:bg-stone-800 text-stone-400 hover:text-stone-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Asistan İkonu */}
            <div className="relative mx-auto w-20 h-20">
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
                  isListening
                    ? 'bg-purple-600 text-white shadow-xl shadow-purple-600/40 animate-pulse scale-105'
                    : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300'
                }`}
              >
                {isListening ? <Mic className="w-10 h-10 animate-bounce" /> : <MicOff className="w-8 h-8" />}
              </div>
              {isListening && (
                <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-purple-500" />
                </span>
              )}
            </div>

            <div>
              <h3 className="text-base font-black text-stone-900 dark:text-white">
                {isListening ? 'Sizi Dinliyorum...' : 'Sesli Kuaför Asistanı'}
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-1">
                {isListening ? 'Komutunuzu söyleyin, sistem anında uygulasın' : 'Mikrofona basarak konuşmaya başlayın'}
              </p>
            </div>

            {/* Dinlenen Metin */}
            {transcript && (
              <div className="p-3.5 rounded-2xl bg-stone-50 dark:bg-stone-800/60 border border-stone-200 dark:border-stone-700/60 text-xs font-bold text-stone-800 dark:text-stone-200">
                &ldquo;{transcript}&rdquo;
              </div>
            )}

            {/* Asistan Yanıtı */}
            {lastResponse && (
              <div
                className={`p-3.5 rounded-2xl text-xs font-bold flex items-center gap-2 text-left ${
                  lastActionStatus === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {lastActionStatus === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span>{lastResponse}</span>
              </div>
            )}

            {/* Kontrol Butonları */}
            <div className="flex justify-center gap-2">
              <button
                type="button"
                onClick={toggleListen}
                className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 cursor-pointer transition-all ${
                  isListening
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/20'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-4 h-4" />
                    <span>Dinlemeyi Durdur</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-4 h-4" />
                    <span>Konuşmaya Başla</span>
                  </>
                )}
              </button>
            </div>

            {/* Örnek Komutlar Rehberi */}
            <div className="text-left pt-3 border-t border-stone-100 dark:border-stone-800 space-y-1.5 text-[11px] text-stone-500 dark:text-stone-400">
              <p className="font-bold text-stone-700 dark:text-stone-300">Örnek Sesli Komutlar:</p>
              <div className="space-y-1">
                <p>• &quot;Cuma 14:00 Mehmet saç kesimi&quot; <span className="text-stone-400">→ Randevu ekler</span></p>
                <p>• &quot;Bugün 5&apos;ten sonrasını kapat&quot; <span className="text-stone-400">→ Mola/blok koyar</span></p>
                <p>• &quot;Bugün 5&apos;ten sonrasını aç&quot; <span className="text-stone-400">→ Kapatılan saati geri açar</span></p>
                <p>• &quot;Molayı kaldır / Saatleri aç&quot; <span className="text-stone-400">→ Randevulara açar</span></p>
                <p>• &quot;Ahmet&apos;in randevusunu yarın 4&apos;e al&quot; <span className="text-stone-400">→ Saati günceller</span></p>
                <p>• &quot;Sıradaki müşterim kim?&quot; <span className="text-stone-400">→ Sesli cevaplar</span></p>
                <p>• &quot;Emre&apos;ye perşembe izin ver&quot; <span className="text-stone-400">→ İzin tanımlar</span></p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
