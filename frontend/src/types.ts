export interface Place {
    id?: string;
    name: string;
    address: string;
    phone: string;
    rating: number;
    reviews: number;
    priceLevel?: string;
    website?: string;
}

export interface SearchResponse {
    status: string;
    data: Place[];
    detail?: string;
}

export type SearchType = 'food' | 'hotel';
export type LangCode = 'zh-TW' | 'en' | 'zh-CN';

export interface I18nContent {
    title: string;
    placeholder: string;
    placeholderHotel: string;
    searchBtn: string;
    loading: string;
    recommendTitle: string;
    recommendTitleHotel: string;
    randomBtn: string;
    randomBtnHotel: string;
    thName: string;
    thNameHotel: string;
    thAddress: string;
    thPhone: string;
    thRating: string;
    thReviews: string;
    thPrice: string;
    thWebsite: string;
    btnPrev: string;
    btnNext: string;
    emptyState: string;
    alertEmpty: string;
    alertNotFound: string;
    alertNotFoundHotel: string;
    alertError: string;
    alertServerErr: string;
    reviewsCount: string;
    noData: string;
    pageInfo: (cur: number, total: number, count: number) => string;
    modalTitleToday: string;
    modalTitleTodayHotel: string;
    modalTitleRecommend: (meal: string) => string;
    modalName: string;
    modalAddress: string;
    modalReroll: string;
    modalClose: string;
    modalMap: string;
    tabFood: string;
    tabHotel: string;
    hotelHint: string;
    visitWebsite: string;
    priceLabel: string;
}
