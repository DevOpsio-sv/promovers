import { DATA_RETENTION_DAYS } from "../lib/config/site.ts";
import { publicConfig } from "../lib/config/public.ts";
import { Footer, Header } from "../components/SiteChrome.tsx";

function configured(value: string, missing: string) {
  return value || missing;
}

export function PrivacyPage() {
  return (
    <div>
      <a className="skip-link" href="#privacy-title">
        Към текста
      </a>
      <Header onHome={false} />
      <main className="mx-auto max-w-3xl px-4 py-10">
        <h1 id="privacy-title" className="text-3xl font-bold tracking-tight">
          Политика за поверителност
        </h1>
        <p className="mt-4 text-muted">
          Тази страница описва как се обработват данните от формата за заявка. Тя не е регистрация и не създава
          клиентски профил.
        </p>

        <h2 className="mt-8 text-2xl font-bold">Кой обработва данните</h2>
        <p className="mt-3">
          Администратор:{" "}
          {configured(publicConfig.controllerName, "не е попълнен в конфигурацията.")}
        </p>
        <p className="mt-2">
          ЕИК / идентификатор: {configured(publicConfig.controllerId, "не е попълнен в конфигурацията.")}
        </p>
        <p className="mt-2">
          Адрес: {configured(publicConfig.controllerAddress, "не е попълнен в конфигурацията.")}
        </p>
        <p className="mt-2">
          Имейл за заявки по лични данни:{" "}
          {publicConfig.controllerEmail ? (
            <a className="font-semibold" href={`mailto:${publicConfig.controllerEmail}`}>
              {publicConfig.controllerEmail}
            </a>
          ) : (
            "не е попълнен в конфигурацията."
          )}
        </p>

        <h2 className="mt-8 text-2xl font-bold">Какви данни събираме</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5">
          <li>Име и телефон</li>
          <li>Имейл, ако го посочите</li>
          <li>Адрес или район и евентуален втори адрес</li>
          <li>Предпочитана дата, час и бележка</li>
          <li>Избраната услуга и настройките от калкулатора</li>
          <li>Номер на заявката и технически запис за ограничаване на злоупотреби</li>
        </ul>
        <p className="mt-3">
          Не качваме снимки. Не искаме данни за платежни карти. IP адресът се пази само като хеш, не в четим вид.
        </p>

        <h2 className="mt-8 text-2xl font-bold">Защо</h2>
        <p className="mt-3">
          Данните се използват, за да отговорим на заявката, да потвърдим детайлите и крайната цена и да предпазим
          формата от автоматични злоупотреби. Основанието е преддоговорна стъпка по ваше искане.
        </p>

        <h2 className="mt-8 text-2xl font-bold">Колко време се пазят</h2>
        <p className="mt-3">
          Заявките се пазят до {DATA_RETENTION_DAYS} дни, освен ако по-дълъг срок не е нужен за счетоводство или
          защита на правен интерес. След това се изтриват от базата.
        </p>
        <p className="mt-3">
          Изтриването се прави с команда към базата, описана в документацията за разработка. Ако имейлът на
          администратора е конфигуриран, можете да поискате достъп, корекция или изтриване на заявката си.
        </p>

        <h2 className="mt-8 text-2xl font-bold">Кой получава данните</h2>
        <p className="mt-3">
          Заявката се записва в Cloudflare D1. Проверката срещу злоупотреба се прави с Cloudflare Turnstile. Имейл до
          екипа се изпраща само ако доставчикът е конфигуриран. Не продаваме данни и не ги ползваме за рекламни
          списъци.
        </p>

        <h2 className="mt-8 text-2xl font-bold">Бисквитки</h2>
        <p className="mt-3">
          Сайтът не поставя рекламни или аналитични бисквитки и не пази заявката в браузъра. Формата зарежда
          Cloudflare Turnstile само за защита от автоматични заявки. Подробностите, включително кои бисквитки зависят
          от таблото на Cloudflare, са на страницата{" "}
          <a className="font-semibold text-accent-dark" href="/cookies">
            Бисквитки и локално съхранение
          </a>
          .
        </p>
        <p className="mt-6">
          <a className="font-semibold text-accent-dark" href="/">
            Обратно към заявката
          </a>
        </p>
      </main>
      <Footer onHome={false} />
    </div>
  );
}
