import { Link } from 'react-router-dom'
import styles from './StudioPages.module.css'

export function HelpPage() {
  return (
    <>
      <div className="breadcrumbs">
        <Link to="/">Главная</Link>
        <span>/</span>
        <span>Помощь</span>
      </div>
      <header className="page-heading">
        <span className="eyebrow">Печатная памятка</span>
        <h1>
          От макета
          <br />
          до готового тиража
        </h1>
        <p>Файл, бумага и несколько важных деталей перед печатью.</p>
      </header>
      <div className={styles.helpLayout}>
        <nav className={styles.helpNav} aria-label="Разделы помощи">
          <Link to="/delivery#artwork">Подготовка макета</Link>
          <Link to="/delivery#timing">Срок изготовления</Link>
          <Link to="/delivery#pickup">Получение и оплата</Link>
        </nav>
        <div className={styles.helpContent}>
          <section className="panel stack" id="artwork" tabIndex={-1}>
            <span className={styles.number}>01 / Файл для печати</span>
            <h2>Подготовьте макет</h2>
            <dl className={styles.helpSpecs}>
              <div>
                <dt>Форматы файла</dt>
                <dd>PDF, PNG, JPEG</dd>
              </div>
              <div>
                <dt>Размер файла</dt>
                <dd>До 10 МБ</dd>
              </div>
              <div>
                <dt>Разрешение растра</dt>
                <dd>300 dpi</dd>
              </div>
            </dl>
            <p>
              Предпочтителен PDF с внедрёнными шрифтами. Для растровых изображений рекомендуем
              разрешение 300 dpi в размере печати. Добавьте вылеты по 3 мм с каждой стороны и
              оставьте важные элементы не ближе 5 мм к краю обрезки.
            </p>
            <p className="small muted">
              До начала печати менеджер проверяет макет вручную. При загрузке сервис проверяет
              размер, расширение и сигнатуру файла; это не заменяет допечатную проверку.
            </p>
          </section>
          <section className="panel stack" id="timing" tabIndex={-1}>
            <span className={styles.number}>02 / После проверки</span>
            <h2>Срок изготовления</h2>
            <p>
              Ориентировочно 3 рабочих дня после проверки макета. Если понадобятся исправления, в
              заказе появится причина и возможность загрузить новую версию.
            </p>
            <Link to="/account/orders" className="text-link">
              Посмотреть свои заказы
            </Link>
          </section>
          <section className="panel stack" id="pickup" tabIndex={-1}>
            <span className={styles.number}>03 / Когда всё готово</span>
            <h2>Получение и оплата</h2>
            <p>
              В приложении реализован самовывоз с оплатой при получении. Когда заказ готов, его
              статус изменится в личном кабинете.
            </p>
            <div className="notice">
              «Тираж» — портфолио-проект вымышленной типографии. Производство, адрес выдачи,
              реальные платежи и доставка в демонстрации отсутствуют. Не загружайте личные или
              конфиденциальные документы.
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
