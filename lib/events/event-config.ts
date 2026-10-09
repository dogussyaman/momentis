export const EVENT_CONFIG = {
  dugun: {
    id: 'dugun',
    label: 'Düğün',
    description: 'Nikâh, tören ve resepsiyon davetleri',
    icon: 'Rings',
    required: ['brideName', 'groomName', 'date'],
    optional: ['brideMother', 'brideFather', 'groomMother', 'groomFather', 'time', 'venue', 'address', 'city', 'story', 'dressCode', 'rsvpDeadline'],
    fieldLabels: {
      brideName: 'Gelin Adı Soyadı',
      groomName: 'Damat Adı Soyadı',
      date: 'Etkinlik Tarihi',
      time: 'Saat',
      venue: 'Mekan',
      address: 'Adres',
      city: 'Şehir',
      brideMother: 'Gelin Annesi',
      brideFather: 'Gelin Babası',
      groomMother: 'Damat Annesi',
      groomFather: 'Damat Babası',
      story: 'Hikayemiz',
      dressCode: 'Kıyafet Kodu',
      rsvpDeadline: 'LCV Son Tarih'
    },
    groups: [
      { id: 'couple', label: 'Çift Bilgileri', fields: ['brideName', 'groomName'] },
      { id: 'event', label: 'Etkinlik Bilgileri', fields: ['date', 'time', 'venue', 'address', 'city'] },
      { id: 'family', label: 'Aileler (İsteğe Bağlı)', fields: ['brideMother', 'brideFather', 'groomMother', 'groomFather'] },
      { id: 'extra', label: 'Ek Bilgiler', fields: ['story', 'dressCode', 'rsvpDeadline'] }
    ],
    defaultGreeting: 'Düğünümüze Davetlisiniz'
  },
  kina: {
    id: 'kina',
    label: 'Kına Gecesi',
    description: 'Geleneksel ve modern kına geceleri',
    icon: 'Moon',
    required: ['brideName', 'date'],
    optional: ['groomName', 'brideMother', 'brideFather', 'time', 'venue', 'address', 'city'],
    fieldLabels: {
      brideName: 'Gelin Adı Soyadı',
      groomName: 'Damat Adı Soyadı (İsteğe Bağlı)',
      date: 'Etkinlik Tarihi',
      time: 'Saat',
      venue: 'Mekan',
      address: 'Adres',
      city: 'Şehir',
      brideMother: 'Gelin Annesi',
      brideFather: 'Gelin Babası'
    },
    groups: [
      { id: 'host', label: 'Gelin & Damat', fields: ['brideName', 'groomName'] },
      { id: 'event', label: 'Etkinlik Bilgileri', fields: ['date', 'time', 'venue', 'address', 'city'] },
      { id: 'family', label: 'Aileler (İsteğe Bağlı)', fields: ['brideMother', 'brideFather'] }
    ],
    defaultGreeting: 'Kına Gecemize Davetlisiniz'
  },
  nisan: {
    id: 'nisan',
    label: 'Nişan',
    description: 'Nişan töreni ve kutlama davetleri',
    icon: 'Ring',
    required: ['brideName', 'groomName', 'date'],
    optional: ['brideMother', 'brideFather', 'groomMother', 'groomFather', 'time', 'venue', 'address', 'city'],
    fieldLabels: {
      brideName: 'Gelin Adı Soyadı',
      groomName: 'Damat Adı Soyadı',
      date: 'Etkinlik Tarihi',
      time: 'Saat',
      venue: 'Mekan',
      address: 'Adres',
      city: 'Şehir',
      brideMother: 'Gelin Annesi',
      brideFather: 'Gelin Babası',
      groomMother: 'Damat Annesi',
      groomFather: 'Damat Babası'
    },
    groups: [
      { id: 'couple', label: 'Çift Bilgileri', fields: ['brideName', 'groomName'] },
      { id: 'event', label: 'Etkinlik Bilgileri', fields: ['date', 'time', 'venue', 'address', 'city'] },
      { id: 'family', label: 'Aileler (İsteğe Bağlı)', fields: ['brideMother', 'brideFather', 'groomMother', 'groomFather'] }
    ],
    defaultGreeting: 'Nişanımıza Davetlisiniz'
  },
  soz: {
    id: 'soz',
    label: 'Söz',
    description: 'Samimi söz kesimi buluşmaları',
    icon: 'HeartHandshake',
    required: ['brideName', 'groomName', 'date'],
    optional: ['brideMother', 'brideFather', 'groomMother', 'groomFather', 'time', 'venue', 'address', 'city'],
    fieldLabels: {
      brideName: 'Gelin Adı Soyadı',
      groomName: 'Damat Adı Soyadı',
      date: 'Etkinlik Tarihi',
      time: 'Saat',
      venue: 'Mekan',
      address: 'Adres',
      city: 'Şehir',
      brideMother: 'Gelin Annesi',
      brideFather: 'Gelin Babası',
      groomMother: 'Damat Annesi',
      groomFather: 'Damat Babası'
    },
    groups: [
      { id: 'couple', label: 'Çift Bilgileri', fields: ['brideName', 'groomName'] },
      { id: 'event', label: 'Etkinlik Bilgileri', fields: ['date', 'time', 'venue', 'address', 'city'] },
      { id: 'family', label: 'Aileler (İsteğe Bağlı)', fields: ['brideMother', 'brideFather', 'groomMother', 'groomFather'] }
    ],
    defaultGreeting: 'Söz Törenimize Davetlisiniz'
  },
  'dogum-gunu': {
    id: 'dogum-gunu',
    label: 'Doğum Günü',
    description: 'Zarif doğum günü kutlamaları',
    icon: 'Cake',
    required: ['celebrantName', 'date'],
    optional: ['age', 'hostName', 'time', 'venue', 'address', 'city'],
    fieldLabels: {
      celebrantName: 'Kutlanan Kişi',
      age: 'Yaş (İsteğe Bağlı)',
      hostName: 'Ev Sahibi (İsteğe Bağlı)',
      date: 'Etkinlik Tarihi',
      time: 'Saat',
      venue: 'Mekan',
      address: 'Adres',
      city: 'Şehir'
    },
    groups: [
      { id: 'celebrant', label: 'Kutlanan Kişi', fields: ['celebrantName', 'age', 'hostName'] },
      { id: 'event', label: 'Etkinlik Bilgileri', fields: ['date', 'time', 'venue', 'address', 'city'] }
    ],
    defaultGreeting: 'Doğum Günü Kutlamasına Davetlisiniz'
  },
  'baby-shower': {
    id: 'baby-shower',
    label: 'Baby Shower',
    description: 'Bebek bekleme partileri',
    icon: 'Baby',
    required: ['parentNames', 'date'],
    optional: ['babyName', 'time', 'venue', 'address', 'city'],
    fieldLabels: {
      parentNames: 'Anne / Baba Adı',
      babyName: 'Bebek Adı (Belli ise)',
      date: 'Etkinlik Tarihi',
      time: 'Saat',
      venue: 'Mekan',
      address: 'Adres',
      city: 'Şehir'
    },
    groups: [
      { id: 'parents', label: 'Ebeveyn Bilgileri', fields: ['parentNames', 'babyName'] },
      { id: 'event', label: 'Etkinlik Bilgileri', fields: ['date', 'time', 'venue', 'address', 'city'] }
    ],
    defaultGreeting: 'Baby Shower Partimize Davetlisiniz'
  },
  kurumsal: {
    id: 'kurumsal',
    label: 'Kurumsal',
    description: 'Gala, lansman ve kurumsal davetler',
    icon: 'Briefcase',
    required: ['companyName', 'eventTitle', 'date'],
    optional: ['contactName', 'contactPhone', 'contactEmail', 'time', 'venue', 'address', 'city'],
    fieldLabels: {
      companyName: 'Şirket/Kurum Adı',
      eventTitle: 'Etkinlik Başlığı',
      contactName: 'İletişim Kişisi',
      contactPhone: 'İletişim Telefonu',
      contactEmail: 'İletişim E-posta',
      date: 'Etkinlik Tarihi',
      time: 'Saat',
      venue: 'Mekan',
      address: 'Adres',
      city: 'Şehir'
    },
    groups: [
      { id: 'company', label: 'Kurum & Etkinlik', fields: ['companyName', 'eventTitle'] },
      { id: 'event', label: 'Etkinlik Bilgileri', fields: ['date', 'time', 'venue', 'address', 'city'] },
      { id: 'contact', label: 'İletişim Bilgileri', fields: ['contactName', 'contactPhone', 'contactEmail'] }
    ],
    defaultGreeting: 'Etkinliğimize Davetlisiniz'
  }
};

export const EVENT_TYPES_LIST = Object.values(EVENT_CONFIG);
