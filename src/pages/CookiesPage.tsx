import { COOKIE_INFO_UPDATED } from "../lib/config/site.ts";
import { Footer, Header } from "../components/SiteChrome.tsx";

export function CookiesPage() {
  return (
    <div>
      <a className="skip-link" href="#cookies-title">
        Към текста
      </a>
      <Header onHome={false} />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 id="cookies-title" className="text-3xl font-bold tracking-tight">
          Бисквитки и локално съхранение
        </h1>
        <p className="mt-4 text-muted">Последна актуализация: {COOKIE_INFO_UPDATED}.</p>
        <p className="mt-4">
          Бисквитката е малък запис, който сайтът или вградена услуга може да остави в браузъра. Локално съхранение
          е друг запис в браузъра, например localStorage. Тук са описани само технологиите, които този сайт реално
          зарежда или които Cloudflare може да включи от инфраструктурата.
        </p>

        <h2 className="mt-8 text-2xl font-bold">Какво поставя самият сайт</h2>
        <p className="mt-3">
          Кодът на ProMovers не записва бисквитки и не използва localStorage, sessionStorage или IndexedDB. Името,
          телефонът, адресът и изчислената цена остават в паметта на страницата, докато тя е отворена, и се изпращат
          към заявката едва след потвърждение.
        </p>
        <p className="mt-3">Няма аналитични, рекламни или маркетингови бисквитки и няма банер за такова съгласие.</p>

        <h2 className="mt-8 text-2xl font-bold">Cloudflare Turnstile</h2>
        <p className="mt-3">
          Формата за заявка зарежда скрипт от <span className="font-semibold">challenges.cloudflare.com</span>, за да
          отсее автоматични злоупотреби. Доставчик е Cloudflare. Проверката е строго необходима за изпращане на
          заявката и не се използва за реклама или профилиране между сайтове.
        </p>
        <p className="mt-3">
          Когато платформата за проверка издаде доказателство, че проверката е мината, Cloudflare документира
          бисквитки като <span className="font-semibold">cf_clearance</span> и вътрешни{" "}
          <span className="font-semibold">cf_chl_*</span> бисквитки. Дали конкретна визита получава такава бисквитка,
          се решава от Cloudflare. Срокът не е зададен в този проект.
        </p>

        <h2 className="mt-8 text-2xl font-bold">Бисквитки от таблото на Cloudflare</h2>
        <p className="mt-3">
          Ако в таблото е включен Bot Fight Mode или Bot Management, Cloudflare може да постави{" "}
          <span className="font-semibold">__cf_bm</span>. Документацията описва срока като 30 минути неактивност.
          Тази бисквитка не идва от кода на сайта и трябва да се провери в таблото. Load Balancer, Waiting Room и
          правила за ограничаване с уникален посетител не са включени от този проект и не бива да се приемат за
          активни без проверка.
        </p>

        <h2 className="mt-8 text-2xl font-bold">Защо няма банер</h2>
        <p className="mt-3">
          Банер се показва, когато сайтът ползва несъществено съхранение или достъп до устройството, например
          статистика или реклама. Такива инструменти няма. Защитата на формата е необходима за заявената услуга.
          Затова предпочитанието не се пази в браузъра и няма бутон за оттегляне на маркетингово съгласие.
        </p>

        <h2 className="mt-8 text-2xl font-bold">Настройки на браузъра</h2>
        <p className="mt-3">
          Можете да изтриете или блокирате бисквитки от настройките на браузъра. Ако блокирате бисквитките на
          Cloudflare, формата може да не успее да потвърди, че заявката не е автоматична. Сайтът няма отделен ключ за
          аналитично или рекламно съгласие, защото такива категории не се зареждат.
        </p>
        <p className="mt-6">
          <a className="font-semibold text-accent-dark" href="/privacy">
            Политика за поверителност
          </a>
        </p>
        <p className="mt-3">
          <a className="font-semibold text-accent-dark" href="/">
            Обратно към заявката
          </a>
        </p>
      </main>
      <Footer onHome={false} />
    </div>
  );
}
