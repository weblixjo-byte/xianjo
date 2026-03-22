// src/constants/deliveryZones.ts
export interface DeliveryZone {
  id: string;
  nameEn: string;
  nameAr: string;
  fee: number;
}

export const DELIVERY_ZONES: DeliveryZone[] = [
  { id: 'lweibdeh', nameEn: 'Jabal Al-Lweibdeh', nameAr: 'جبل اللويبدة', fee: 1.0 },
  { id: 'abdali', nameEn: 'Al-Abdali / Downtown', nameAr: 'العبدلي / وسط البلد', fee: 1.5 },
  { id: 'shmeisani', nameEn: 'Shmeisani', nameAr: 'الشميساني', fee: 2.0 },
  { id: 'abdoun', nameEn: 'Abdoun / Deir Ghbar', nameAr: 'عبدون / دير غبار', fee: 2.5 },
  { id: 'sweifieh', nameEn: 'Sweifieh / 7th Circle', nameAr: 'الصويفية / الدوار السابع', fee: 3.0 },
  { id: 'khalda', nameEn: 'Khalda / Tla\' Al-Ali', nameAr: 'خلدا / تلاع العلي', fee: 3.5 },
  { id: 'jubeiha', nameEn: 'Jubeiha / Abu Nseir', nameAr: 'الجبيهة / أبو نصير', fee: 4.0 },
  { id: 'marka', nameEn: 'Marka / Airport Road', nameAr: 'ماركا / طريق المطار', fee: 5.0 },
];
