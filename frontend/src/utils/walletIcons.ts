import {
    faWallet, faPiggyBank, faCreditCard, faMoneyBillWave, faCoins,
    faBuildingColumns, faChartLine, faCartShopping, faCar, faHouse,
    faPlane, faGift, faGraduationCap, faHeart, faBriefcase,
    faBasketShopping, faTag, faGasPump, faMugHot, faBus,
    faTrain, faShirt, faBolt, faGamepad, faTv,
    faPaw, faLaptop, faMobile, faWrench, faDumbbell
} from '@fortawesome/free-solid-svg-icons';

export const WALLET_ICONS = {
    wallet: faWallet, piggyBank: faPiggyBank, creditCard: faCreditCard, moneyBill: faMoneyBillWave, coins: faCoins,
    bank: faBuildingColumns, invest: faChartLine, cart: faCartShopping, car: faCar, house: faHouse,
    plane: faPlane, gift: faGift, education: faGraduationCap, health: faHeart, work: faBriefcase,
    basket: faBasketShopping, tag: faTag, gas: faGasPump, coffee: faMugHot, bus: faBus,
    train: faTrain, clothes: faShirt, energy: faBolt, games: faGamepad, tv: faTv,
    pets: faPaw, laptop: faLaptop, mobile: faMobile, repair: faWrench, gym: faDumbbell
};

export type WalletIconKey = keyof typeof WALLET_ICONS;