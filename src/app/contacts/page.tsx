export const metadata = { title: "Контакты" };

export default function ContactsPage() {
  return (
    <div className="container section" style={{ maxWidth: 820 }}>
      <h1>Контакты</h1>
      <div className="grid grid-2" style={{ marginTop: 24 }}>
        <div className="card">
          <h3>Поддержка</h3>
          <p>
            <a href="mailto:hello@example.com">hello@example.com</a>
            <br />
            <a href="tel:+70000000000">+7 000 000-00-00</a>
          </p>
          <p className="muted small">Ежедневно с 9:00 до 21:00 по Москве</p>
        </div>
        <div className="card">
          <h3>Производство</h3>
          <p>Адрес производства и реквизиты компании.</p>
          <p className="muted small">Замените на свои данные в src/app/contacts/page.tsx</p>
        </div>
      </div>
    </div>
  );
}
