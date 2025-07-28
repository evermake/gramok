/* eslint-disable prefer-template, antfu/consistent-list-newline */

import { DIGITS, LATIN_LOWER, LATIN_UPPER, randInt, randItem, randStr } from '../utils/random'
import { USERNAME_MAX_SIZE, USERNAME_MIN_SIZE } from './constants'

export const RANDOM = Symbol('Random')

export type OrRandom<T> = T | typeof RANDOM

export function valueOrRandom<T>(value: OrRandom<T>, randomFn: () => T): T {
  return value === RANDOM ? randomFn() : value
}

/**
 * @see https://core.telegram.org/api/bots/ids#user-ids
 */
export function randomUserId(): number {
  return randInt(1, 0xFFFFFFFFFF)
}

export function randomUsername(): string {
  const first = randStr(1, LATIN_LOWER + LATIN_UPPER)
  const tail = randStr(
    randInt(USERNAME_MIN_SIZE - 1, USERNAME_MAX_SIZE - 1),
    LATIN_LOWER + LATIN_UPPER + DIGITS,
  )
  return `${first}${tail}`
}

export function randomBotUsername(): string {
  const b = randItem(['B', 'b'])
  const o = randItem(['O', 'o'])
  const t = randItem(['T', 't'])
  return `${randomUsername().slice(0, -3)}${b}${o}${t}`
}

export function randomBotSecret(): string {
  return randStr(randInt(12, 64), LATIN_LOWER + LATIN_UPPER + DIGITS + '_-')
}

export function randomFirstName(): string {
  return randItem([
    // English
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Emma', 'Robert', 'Olivia',
    'William', 'Ava', 'Richard', 'Isabella', 'Joseph', 'Sophia', 'Thomas', 'Charlotte', 'Christopher', 'Mia',
    // Russian
    'Иван', 'Елена', 'Сергей', 'Татьяна', 'Владимир', 'Ольга', 'Андрей', 'Ирина', 'Алексей', 'Наталья',
    'Дмитрий', 'Светлана', 'Михаил', 'Александр', 'Николай', 'Марина', 'Евгений', 'Людмила', 'Игорь', 'Галина',
    // Spanish
    'José', 'María', 'Antonio', 'Carmen', 'Manuel', 'Ana', 'Francisco', 'Isabel', 'David', 'Pilar',
    'Daniel', 'Dolores', 'Carlos', 'Teresa', 'Miguel', 'Rosa', 'Rafael', 'Antonia', 'Pedro', 'Francisca',
    // French
    'Pierre', 'Marie', 'Jean', 'Nathalie', 'Michel', 'Isabelle', 'Philippe', 'Sylvie', 'Alain', 'Catherine',
    'Nicolas', 'Françoise', 'Patrick', 'Martine', 'Christophe', 'Christine', 'Daniel', 'Monique', 'Bernard', 'Brigitte',
    // German
    'Hans', 'Anna', 'Klaus', 'Petra', 'Wolfgang', 'Sabine', 'Jürgen', 'Monika', 'Dieter', 'Gabriele',
    'Helmut', 'Ursula', 'Manfred', 'Ingrid', 'Günter', 'Christa', 'Horst', 'Renate', 'Uwe', 'Angelika',
    // Italian
    'Giuseppe', 'Maria', 'Antonio', 'Anna', 'Francesco', 'Giuseppina', 'Giovanni', 'Rosa', 'Luigi', 'Angela',
    'Vincenzo', 'Giovanna', 'Salvatore', 'Teresa', 'Mario', 'Lucia', 'Pietro', 'Carmela', 'Angelo', 'Caterina',
    // Chinese
    '王伟', '李娜', '张强', '刘敏', '陈杰', '杨静', '黄磊', '赵丽', '周涛', '吴燕',
    '徐明', '孙红', '朱华', '马丽', '胡军', '郭敏', '林峰', '何静', '高伟', '梁娜',
    // Japanese
    '太郎', '花子', '次郎', '美咲', '健太', 'さくら', '大輔', '愛', '翔太', '結衣',
    '拓也', '美穂', '雄太', '恵', '智也', '真由美', '直樹', '由美', '和也', '裕子',
    // Arabic
    'محمد', 'فاطمة', 'أحمد', 'عائشة', 'علي', 'خديجة', 'حسن', 'زينب', 'عمر', 'مريم',
    'يوسف', 'أمينة', 'إبراهيم', 'سارة', 'عبدالله', 'نور', 'خالد', 'ليلى', 'سعد', 'هدى',
  ])
}

export function randomLastName(): string {
  return randItem([
    // English
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
    'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin',
    // Russian
    'Иванов', 'Петров', 'Сидоров', 'Смирнов', 'Кузнецов', 'Попов', 'Васильев', 'Соколов', 'Михайлов', 'Новиков',
    'Федоров', 'Морозов', 'Волков', 'Алексеев', 'Лебедев', 'Семенов', 'Егоров', 'Павлов', 'Козлов', 'Степанов',
    // Spanish
    'García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín',
    'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Gutiérrez',
    // French
    'Martin', 'Bernard', 'Dubois', 'Thomas', 'Robert', 'Richard', 'Petit', 'Durand', 'Leroy', 'Moreau',
    'Simon', 'Laurent', 'Lefebvre', 'Michel', 'Garcia', 'David', 'Bertrand', 'Roux', 'Vincent', 'Fournier',
    // German
    'Müller', 'Schmidt', 'Schneider', 'Fischer', 'Weber', 'Meyer', 'Wagner', 'Becker', 'Schulz', 'Hoffmann',
    'Schäfer', 'Koch', 'Bauer', 'Richter', 'Klein', 'Wolf', 'Schröder', 'Neumann', 'Schwarz', 'Zimmermann',
    // Italian
    'Rossi', 'Russo', 'Ferrari', 'Esposito', 'Bianchi', 'Romano', 'Colombo', 'Ricci', 'Marino', 'Greco',
    'Bruno', 'Gallo', 'Conti', 'De Luca', 'Mancini', 'Costa', 'Giordano', 'Rizzo', 'Lombardi', 'Moretti',
    // Chinese
    '王', '李', '张', '刘', '陈', '杨', '黄', '赵', '周', '吴',
    '徐', '孙', '朱', '马', '胡', '郭', '林', '何', '高', '梁',
    // Japanese
    '佐藤', '鈴木', '高橋', '田中', '渡辺', '伊藤', '山本', '中村', '小林', '加藤',
    '吉田', '山田', '佐々木', '山口', '松本', '井上', '木村', '林', '清水', '山崎',
    // Arabic
    'العلي', 'الأحمد', 'المحمد', 'الحسن', 'الخطيب', 'الشام', 'العبد', 'الحمد', 'السيد', 'الملك',
    'النور', 'الدين', 'الحق', 'السلام', 'الرحمن', 'الكريم', 'العزيز', 'الحكيم', 'القادر', 'الصبور',
    // Polish
    'Nowak', 'Kowalski', 'Wiśniewski', 'Wójcik', 'Kowalczyk', 'Kamiński', 'Lewandowski', 'Zieliński', 'Szymański', 'Woźniak',
    // Dutch
    'De Jong', 'Jansen', 'De Vries', 'Van den Berg', 'Van Dijk', 'Bakker', 'Janssen', 'Visser', 'Smit', 'Meijer',
    // Portuguese
    'Silva', 'Santos', 'Ferreira', 'Pereira', 'Oliveira', 'Sousa', 'Rodrigues', 'Fernandes', 'Gomes', 'Martins',
    // Korean
    '김', '이', '박', '최', '정', '강', '조', '윤', '장', '임',
  ])
}

export function randomLangauge(): string {
  return randItem([
    'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 'ar', 'hi',
    'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi', 'cs', 'hu', 'ro', 'bg', 'hr',
    'sk', 'sl', 'et', 'lv', 'lt', 'mt', 'el', 'cy', 'ga', 'eu', 'ca', 'gl',
    'ast', 'an', 'oc', 'co', 'br', 'gd', 'gv', 'kw', 'cy', 'is', 'fo', 'kl',
    'se', 'fi', 'et', 'lv', 'lt', 'be', 'uk', 'mk', 'sq', 'sr', 'bs', 'me',
    'hr', 'sl', 'sk', 'cs', 'pl', 'de', 'lb', 'rm', 'fur', 'lld', 'vec', 'lij',
    'pms', 'lmo', 'egl', 'rgn', 'sc', 'nap', 'scn',
  ])
}

export function randomBio(): string {
  return randItem([
    // English
    '23 y.o. designer from San Francisco 🎨',
    'Software engineer passionate about AI 🤖',
    'Travel blogger exploring the world ✈️',
    'Coffee enthusiast and book lover ☕📚',
    'Photographer capturing life moments 📸',
    'Fitness trainer helping people stay healthy 💪',
    'Music producer from Nashville 🎵',
    // Spanish
    'Estudiante de medicina en Madrid 🩺',
    'Amante de la música y los viajes 🎶✈️',
    'Chef apasionado por la cocina italiana 👨‍🍳🍝',
    'Bailarina de flamenco en Sevilla 💃',
    // French
    'Artiste parisien, passionné de peinture 🎨',
    'Développeur web freelance 💻',
    'Professeur de français à Lyon 📖',
    'Pâtissier créatif à Marseille 🥐',
    // German
    'Berliner Musiker und Komponist 🎼',
    'Ingenieur aus München ⚙️',
    'Studentin der Philosophie 🤔',
    'Bierbrauer aus Bayern 🍺',
    // Russian
    'Программист из Москвы 💻',
    'Любитель горных лыж и сноуборда ⛷️🏂',
    'Студентка МГУ, изучаю психологию 🧠',
    'Шахматист из Санкт-Петербурга ♟️',
    // Italian
    'Architetto romano appassionato di storia 🏛️',
    'Cuoco napoletano, specialità pizza 🍕',
    'Gondoliere veneziano 🚣‍♂️',
    // Portuguese
    'Surfista do Rio de Janeiro 🏄‍♂️',
    'Médica veterinária de Lisboa 🐕',
    'Jogador de futebol do Brasil ⚽',
    // Arabic
    'مهندس معماري من دبي 🏗️',
    'طبيب أسنان في القاهرة 🦷',
    'مصور فوتوغرافي من بيروت 📷',
    'طالب طب في الرياض 🩺',
    'فنان تشكيلي من المغرب 🎨',
    // Chinese
    '北京的软件工程师 💻',
    '上海的美食博主 🍜',
    '深圳的创业者 💼',
    '广州的音乐制作人 🎵',
    '成都的熊猫饲养员 🐼',
    '杭州的茶艺师 🍵',
  ])
}
