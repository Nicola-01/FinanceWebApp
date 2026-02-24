import {
    faWallet, faPiggyBank, faCreditCard, faMoneyBillWave,
    faCoins, faBuildingColumns, faChartLine, faReceipt,
    faCartShopping, faBasketShopping, faTag, faShirt, faGift,
    faCar, faBus, faTrain, faPlane, faGasPump, faUmbrellaBeach,
    faHouse, faBolt, faWrench, faWifi, faAppleWhole, faUtensils,
    faMugHot, faBurger, faPizzaSlice, faBowlFood, faBowlRice,
    faWineGlass, faIceCream, faHeart, faStethoscope, faTooth,
    faPills, faKitMedical, faScissors, faBriefcase, faGraduationCap,
    faCalendarDays, faPen, faBook, faGamepad, faTv, faFilm, faMusic,
    faCamera, faDumbbell, faFutbol, faBasketball, faLaptop, faMobile,
    faRobot, faBrain, faWandMagicSparkles, faBaby, faPaw, faDog, faCat
} from '@fortawesome/free-solid-svg-icons';

export const ICONS = {
    // Finance & Money
    wallet: faWallet, piggyBank: faPiggyBank, creditCard: faCreditCard, moneyBill: faMoneyBillWave,
    coins: faCoins, bank: faBuildingColumns, invest: faChartLine, receipt: faReceipt,

    // Shopping & Purchases
    cart: faCartShopping, basket: faBasketShopping, tag: faTag, clothes: faShirt, gift: faGift,

    // Transport & Travel
    car: faCar, bus: faBus, train: faTrain, plane: faPlane, gas: faGasPump, vacation: faUmbrellaBeach,

    // Home & Utilities
    house: faHouse, energy: faBolt, repair: faWrench, internet: faWifi,

    // Food & Dining
    groceries: faAppleWhole, dining: faUtensils, coffee: faMugHot, fastFood: faBurger,
    pizza: faPizzaSlice, bowl: faBowlFood, sushi: faBowlRice, drinks: faWineGlass, dessert: faIceCream,

    // Health & Personal Care
    health: faHeart, doctor: faStethoscope, dentist: faTooth, pharmacy: faPills,
    medical: faKitMedical, haircut: faScissors,

    // Work & Education
    work: faBriefcase, education: faGraduationCap, calendar: faCalendarDays, pen: faPen, books: faBook,

    // Entertainment & Hobbies
    games: faGamepad, tv: faTv, movies: faFilm, music: faMusic, photos: faCamera,

    // Sports & Fitness
    gym: faDumbbell, soccer: faFutbol, basketball: faBasketball,

    // Tech & AI
    laptop: faLaptop, mobile: faMobile, ai: faRobot, mind: faBrain, magic: faWandMagicSparkles,

    // Family & Pets
    baby: faBaby, pets: faPaw, dog: faDog, cat: faCat
};

export type IconKey = keyof typeof ICONS;