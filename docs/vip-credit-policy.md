# VIP talep kredisi ve teslimat politikası

- VIP katalog ve demo sayfaları herkese açıktır. Talep göndermek için oturum ve en az iki kullanılabilir ücretli etkinlik kredisi gerekir.
- Başlangıç paketinin bir ücretsiz proje kotası etkinlik kredisi değildir. VIP kredisi, aynı `billing_grants.remaining_event_credits` bakiyesinden ayrılır; standart proje kullanımıyla ortak bakiyede yarışır ve iki defa harcanamaz.
- Talep kaydı, iki kredilik düşüm ve kredi hareketi MongoDB transaction'ında birlikte yazılır. Transaction desteği bulunmayan MongoDB dağıtımlarında işlem güvenli biçimde başarısız olur; kısmi kayıt yapılmaz.
- Reddedilen veya üretim başlamadan (`in_progress` öncesinde) iptal edilen talep için iki kredi, ilk düşümde kullanılan hibe/grant kaynaklarına iade edilir. Üretim başladıktan sonraki iptallerde iade yoktur; seçilmiş iptal gerekçesi, politika kararı ve admin kimliği kaydedilir.
- Her kredi hareketi talep/kullanıcı kimliği, miktar, gerekçe, zaman ve admin alanlarını içerir. İade ve talep anahtarları veritabanı benzersiz indeksleri ve transaction'larla korunur.
- Talebin teslim edildi durumuna geçmesi için VIP site taslağı yayınlanmış ve kişiye özel hediye davetiye çıktısı (PDF veya görsel) sisteme kaydedilmiş olmalıdır.
- E-posta ve uygulama içi bildirim kayıtları kalıcıdır. Resend yapılandırılmadığında e-posta durumu `not_configured` olarak kalır; uygulama içi bildirim yine oluşturulur.
