import type {
  ClearanceSpace,
  ClearanceVolume,
  FurnitureQuantity,
  HomeSize,
  LoadSize,
  MoveScope,
  ServiceType,
  TimeWindow,
  VanCrew,
  WasteVolume,
} from "./types.ts";

export interface ServiceCopy {
  id: ServiceType;
  title: string;
  menu: string;
  summary: string;
  bullets: readonly string[];
}

export const SERVICES: readonly ServiceCopy[] = [
  {
    id: "movers",
    title: "Хамалски услуги",
    menu: "Хамали",
    summary: "Товарене, разтоварване и носене на мебели, техника и тежки предмети.",
    bullets: [
      "Товарене и разтоварване",
      "Носене на мебели и уреди",
      "Носене по етажи",
      "Тежки предмети",
    ],
  },
  {
    id: "van",
    title: "Транспорт с бус",
    menu: "Бус",
    summary: "Местен транспорт на мебели и уреди, със или без хамали.",
    bullets: [
      "Транспорт в София",
      "Мебели и уреди",
      "Само шофьор или с хамали",
      "Допълнителна спирка по уговорка",
    ],
  },
  {
    id: "moving",
    title: "Преместване на жилища и офиси",
    menu: "Преместване",
    summary: "Апартаменти, къщи и офиси — частично или изцяло.",
    bullets: ["Апартаменти", "Къщи", "Офиси", "Частично или пълно преместване"],
  },
  {
    id: "furniture_removal",
    title: "Извозване на стари мебели",
    menu: "Мебели",
    summary: "Вземане на дивани, легла, гардероби и ненужни домашни вещи.",
    bullets: ["Дивани", "Легла и матраци", "Гардероби", "Стари мебели и вещи"],
  },
  {
    id: "construction_waste",
    title: "Извозване на строителни отпадъци",
    menu: "Отпадъци",
    summary: "Товарене и транспорт на опаковани ремонтни отпадъци до разрешено място.",
    bullets: [
      "Опаковани ремонтни отпадъци",
      "Строителни отпадъци, които се приемат законно",
      "Товарене и транспорт",
      "Предаване на разрешено място",
    ],
  },
  {
    id: "clearance",
    title: "Разчистване на мазета, тавани и гаражи",
    menu: "Разчистване",
    summary: "Изнасяне, товарене и транспорт при разчистване на помещение.",
    bullets: ["Разчистване", "Носене", "Товарене", "Транспорт и предаване, когато е приложимо"],
  },
];

const serviceById = new Map(SERVICES.map((service) => [service.id, service]));

export function serviceTitle(service: ServiceType): string {
  return serviceById.get(service)?.title ?? "Услуга";
}

export const HOME_SIZE_LABELS: Record<HomeSize, string> = {
  studio: "Студио",
  two_room: "Двустаен",
  three_room: "Тристаен",
  house_or_office: "Къща или офис",
};

export const MOVE_SCOPE_LABELS: Record<MoveScope, string> = {
  partial: "Частично",
  complete: "Цялостно",
};

export const LOAD_LABELS: Record<LoadSize, string> = {
  small: "Малък",
  medium: "Среден",
  large: "Голям",
};

export const VAN_CREW_LABELS: Record<VanCrew, string> = {
  driver: "Само бус и шофьор",
  driver_plus_movers: "Бус и двама хамали",
};

export const FURNITURE_LABELS: Record<FurnitureQuantity, string> = {
  single: "Един обемист предмет",
  several: "Няколко вещи",
  many: "Много вещи",
};

export const WASTE_LABELS: Record<WasteVolume, string> = {
  bags: "Няколко чувала",
  van_load: "До един бус",
  multi_trip: "Повече от един курс",
};

export const CLEARANCE_SPACE_LABELS: Record<ClearanceSpace, string> = {
  basement: "Мазе",
  attic: "Таван",
  garage: "Гараж",
};

export const CLEARANCE_VOLUME_LABELS: Record<ClearanceVolume, string> = {
  small: "Малко",
  medium: "Средно",
  large: "Голямо",
};

export const TIME_WINDOW_LABELS: Record<TimeWindow, string> = {
  morning: "Сутрин, 8–12 ч.",
  afternoon: "Следобед, 12–17 ч.",
  evening: "Вечер, 17–20 ч.",
  flexible: "Без предпочитание",
};

export const CARRY_LABELS = {
  short: "До входа",
  medium: "Къс двор или до 20 м",
  long: "По-дълго носене",
} as const;
