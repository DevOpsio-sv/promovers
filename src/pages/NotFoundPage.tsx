import { Footer, Header } from "../components/SiteChrome.tsx";

export function NotFoundPage() {
  return (
    <div>
      <a className="skip-link" href="#not-found-title">
        Към текста
      </a>
      <Header onHome={false} />
      <main className="mx-auto max-w-3xl px-4 py-16">
        <h1 id="not-found-title" className="text-3xl font-bold tracking-tight">
          Страницата не е намерена
        </h1>
        <p className="mt-4 text-lg text-muted">Този адрес не води към страница на ProMovers.</p>
        <p className="mt-6">
          <a className="btn btn-primary" href="/">
            Към началната страница
          </a>
        </p>
      </main>
      <Footer onHome={false} />
    </div>
  );
}
