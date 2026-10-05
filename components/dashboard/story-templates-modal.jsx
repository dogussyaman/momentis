import { BookOpen } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useState } from 'react'

export const STORY_TEMPLATES = [
  {
    title: 'Klasik & Zarif',
    content: `Bir ömür sürecek en güzel yolculuğumuzun ilk adımını atarken, bu özel günümüzde sizleri de yanımızda görmekten büyük mutluluk duyacağız.\n\nSevgiyle başlayan hikâyemizi, ailelerimizin ve sevdiklerimizin huzurunda bir ömür boyu sürecek bir birlikteliğe dönüştürüyoruz. Hayatımızın en anlamlı günlerinden biri olacak bu güzel gecede, mutluluğumuzu sizlerle paylaşmak ve bu özel anımıza birlikte tanıklık etmek istiyoruz.\n\nBu güzel başlangıcımızda sizleri de aramızda görmek dileğiyle…`,
  },
  {
    title: 'Romantik',
    content: `Bazı karşılaşmalar tesadüf, bazı insanlar ise hayatımıza yazılmış en güzel hikâyedir.\n\nBizim hikâyemiz, iki ayrı hayatın aynı hayale inanmasıyla başladı. Birlikte güldük, birlikte büyüdük, güzel anılar biriktirdik ve şimdi hayatımızın geri kalanını aynı yolda yürümek için birbirimize söz veriyoruz.\n\nBu hikâyenin en güzel sayfasını açacağımız düğünümüzde, mutluluğumuzu bizim için değerli olan sizlerle paylaşmak istiyoruz.\n\nSevgimizin, kahkahalarımızın ve mutluluğumuzun arasında sizlerin de olması bu geceyi bizim için çok daha özel kılacak.\n\nBu unutulmaz gecede sizleri de aramızda görmekten mutluluk duyacağız.`,
  },
  {
    title: 'Modern & Samimi',
    content: `Birlikte geçirdiğimiz onca güzel anın ardından, şimdi hayatımızın en güzel kararını kutlama zamanı.\n\nAynı yolda yürümeye, hayatın tüm güzelliklerini ve zorluklarını birlikte karşılamaya, küçük mutlulukları çoğaltmaya ve yeni anılar biriktirmeye karar verdik.\n\nŞimdi bu kararımızı sevdiklerimizin huzurunda kutlamak için güzel bir geceye hazırlanıyoruz.\n\nMüzik, dans, kahkahalar ve bolca mutlulukla geçmesini istediğimiz bu özel gecede, sizin de yanımızda olmanız bizim için en güzel hediye olacak.\n\nHayatımızın bu özel başlangıcını birlikte kutlamak için sizleri düğünümüze davet ediyoruz.`,
  },
  {
    title: 'Şiirsel',
    content: `Bir gün bir yerde kesişti yollarımız…\n\nSonra bir bakış, bir gülümseme, birlikte geçirilen güzel günler ve zamanla büyüyen bir sevgi çıktı karşımıza.\n\nŞimdi ise iki ayrı hikâyeyi tek bir hikâyede buluşturmanın, iki kalbi bir ömür aynı heyecanla attırmanın ve geleceğe birlikte yürümenin mutluluğunu yaşıyoruz.\n\nHayatımızın en güzel anlarından birini paylaşacağımız bu özel gecede, bizi seven ve mutluluğumuzu paylaşan siz değerli dostlarımızın yanımızda olması bizim için tarifsiz bir mutluluk olacak.\n\nAşkımızın yeni başlangıcına birlikte şahit olmanız dileğiyle…`,
  },
  {
    title: 'Aile Odaklı & Geleneksel',
    content: `İki insanın hayatlarını birleştirdiği, iki ailenin birbirine dost olduğu ve güzel bir geleceğin temellerinin atıldığı bu özel günümüzde sizleri de aramızda görmekten onur duyacağız.\n\nSevgi, saygı ve güzel dileklerle çıktığımız bu yolda, hayatımızın en anlamlı günlerinden birini ailelerimiz ve sevdiklerimizle birlikte kutlamak istiyoruz.\n\nBizim için unutulmaz olacak bu gecede, mutluluğumuza ortak olmanız ve bu güzel başlangıcımıza tanıklık etmeniz bizleri çok mutlu edecektir.\n\nDüğün törenimizde sizleri de aramızda görmek dileğiyle…\n\nDavetlimizsiniz.`,
  },
  {
    title: 'Lüks & Premium',
    content: `Bir ömür boyu sürecek bir hikâyenin en güzel sayfasını birlikte açıyoruz.\n\nKalplerimizin aynı heyecanla attığı, hayallerimizin ortak bir gelecekte buluştuğu bu yolculukta artık yeni bir başlangıca adım atıyoruz.\n\nBu özel geceyi yalnızca bir düğün olarak değil; sevginin, dostluğun, aile olmanın ve birlikte geçirilen güzel yılların kutlandığı unutulmaz bir gece olarak hatırlamak istiyoruz.\n\nHayatımızın en değerli anlarından birini, bizim için değerli olan insanlarla paylaşmanın mutluluğunu yaşarken sizleri de bu özel gecenin bir parçası olmaya davet ediyoruz.\n\nYeni hayatımıza attığımız bu ilk adımda, yanımızda olmanız dileğiyle…`,
  },
  {
    title: 'Eğlenceli & Sıcak',
    content: `Uzun zamandır beklenen haber sonunda geldi!\n\nBiz birbirimizi bulduk, birbirimizi sevdik ve hayatımızın geri kalanını birlikte geçirmeye karar verdik.\n\nŞimdi sıra bu güzel kararı hep birlikte kutlamaya geldi!\n\nBol bol müzik dinleyeceğimiz, dans edeceğimiz, güleceğimiz, güzel yemekler yiyeceğimiz ve yıllar sonra bile hatırlayacağımız anılar biriktireceğimiz bu özel gecede sizlerin de bizimle olmasını istiyoruz.\n\nÇünkü mutluluk, sevdiğin insanlarla paylaşıldığında daha da güzel.\n\nBu güzel günümüzde bizimle birlikte eğlenmeye ve mutluluğumuza ortak olmaya bekliyoruz.\n\nDans ayakkabılarınızı unutmayın!`,
  },
  {
    title: 'Minimalist & Duygusal',
    content: `Birlikte bir hayat kurmaya karar verdik.\n\nAynı evde uyanmak, aynı sofrada buluşmak, güzel günleri çoğaltmak, zor günlerde birbirimize destek olmak ve hayatın getireceği her şeyi el ele karşılamak…\n\nBütün bunların başlangıcını yapacağımız bu özel günde, hayatımızda önemli bir yere sahip olan sizlerin de yanımızda olmasını istiyoruz.\n\nÇünkü bazı anlar vardır; yalnızca yaşanmaz, sevdiklerinle paylaşılır ve yıllar boyunca hatırlanır.\n\nBizim için böyle bir an olacak düğünümüzde sizleri de aramızda görmekten mutluluk duyacağız.\n\nSevgiyle başlayan yolculuğumuzun ilk gecesine hoş geldiniz.`,
  },
  {
    title: 'Masalsı',
    content: `Bir zamanlar iki ayrı hayatın içinde yaşayan iki insan vardı…\n\nYolları bir gün kesişti. Birbirlerini tanıdılar, birlikte güldüler, birlikte hayaller kurdular ve zamanla hayatlarının geri kalanını da birlikte geçirmek istediklerini anladılar.\n\nŞimdi hikâyelerinin en güzel bölümüne gelmiş bulunuyorlar.\n\nBu kez mutlu son değil, mutlu bir başlangıç yazılıyor.\n\nVe bu başlangıcın en güzel anlarına, sevdikleri insanların da eşlik etmesini istiyorlar.\n\nMasalımızın en güzel gecesinde sizleri de yanımızda görmekten mutluluk duyacağız.\n\nBirlikte gülelim, birlikte dans edelim ve bu geceyi hep birlikte unutulmaz kılalım.`,
  },
  {
    title: 'Çok Romantik & Duygusal',
    content: `Hayat bazen hiç beklemediğiniz bir anda karşınıza, bütün planlarınızı değiştirecek bir insan çıkarır.\n\nBizim için de böyle oldu.\n\nBirbirimizi tanıdıkça hayatın birlikte daha güzel olduğunu gördük. Küçük mutlulukları birlikte büyüttük, güzel anıları birlikte biriktirdik ve zaman içerisinde aynı geleceği hayal etmeye başladık.\n\nBugün ise o hayalin en güzel adımını atıyoruz.\n\nBirbirimize yalnızca bugünü değil, yarınımızı da emanet ediyoruz. İyi günde, kötü günde, kahkahalarda ve sessizliklerde birbirimizin yanında olacağımıza söz veriyoruz.\n\nBu sözün verileceği, hayatımızın en özel ve en unutulmaz gecesinde sizlerin de yanımızda olması bizim için tarifsiz bir mutluluk.\n\nSevgimizin yeni bir başlangıca dönüştüğü bu özel gecede, mutluluğumuzu paylaşmanız dileğiyle…\n\nSizleri düğünümüze davet ediyoruz.`,
  },
]

export function StoryTemplatesModal({ onSelect }) {
  const [open, setOpen] = useState(false)

  const handleSelect = (content) => {
    onSelect(content)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs text-midnight/70 hover:text-midnight">
          <BookOpen className="h-3.5 w-3.5" />
          Hazır Şablonlar
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-2 border-b">
          <DialogTitle>Hazır Davetiye Metinleri</DialogTitle>
          <DialogDescription>Hikayeniz için size en uygun olan şablonu seçip düzenleyebilirsiniz.</DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 p-6 pt-4">
          <div className="grid gap-4 sm:grid-cols-2">
            {STORY_TEMPLATES.map((t, i) => (
              <div key={i} className="flex flex-col gap-3 rounded-2xl border bg-ivory-50 p-5 transition-colors hover:border-midnight/30">
                <h3 className="font-serif text-lg font-medium">{t.title}</h3>
                <p className="flex-1 whitespace-pre-wrap text-sm text-muted-foreground line-clamp-[8]">{t.content}</p>
                <Button variant="secondary" className="w-full mt-2" onClick={() => handleSelect(t.content)}>
                  Bu Şablonu Kullan
                </Button>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}
