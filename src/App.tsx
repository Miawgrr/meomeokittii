import React, { useState, useEffect, useRef, useMemo } from "react";
import { collection, doc, onSnapshot, setDoc, deleteDoc, updateDoc, increment, arrayUnion, arrayRemove, getDocs, query, orderBy, limit } from "firebase/firestore";
import { db, auth } from "./lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { 
  Search, 
  Plus, 
  ExternalLink, 
  Sparkles, 
  Trash2, 
  X, 
  BookOpen, 
  Link2, 
  User, 
  Copy,
  Layers, 
  Check, 
  Undo2, 
  MessageSquare,
  Bookmark,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  Shuffle,
  ChefHat,
  Utensils,
  Heart,
  PawPrint,
  Sun,
  Moon,
  ArrowUp,
  Lock,
  EyeOff,
  Eye,
  Send,
  Image,
  Flame, Star,
  Palette,
  Type,
  Coins,
  Zap
} from "lucide-react";
import { motion, AnimatePresence, useScroll } from "motion/react";
import { Character, SecretComment } from "./types";
import { CHARACTER_CATEGORIES, enrichCharacter } from "./data/categories";
import { CharacterCard } from "./components/CharacterCard";
import { UserProfile } from "./components/UserProfile";
import { CharacterChatView } from "./components/CharacterChatView";
import CharacterIdeaSuggestions from "./components/CharacterIdeaSuggestions";
import MusicPlayer from "./components/MusicPlayer";
import { ParticleOverlay } from "./components/ParticleOverlay";
import OXMiniGame from "./components/OXMiniGame";
import PlaygroundZone from "./components/PlaygroundZone";
import { SupportCorner } from "./components/SupportCorner";
import { FeelingsBoard } from "./components/FeelingsBoard";
import { playMeowSound, playSlapSound, playAidaSound } from "./utils/audio";
import { isImageUrl, formatImageUrl, handleImageError } from "./utils/image";
import confetti from "canvas-confetti";
import { safeJsonStringify, safeJsonParse } from "./utils/json";
const donateQrImg = formatImageUrl("https://drive.google.com/file/d/1CK1QEMi4hm5dmIFq73zF-DD9PftXYsn6/view?usp=drivesdk");
const lightSakuraBg = new URL("./assets/images/light_sakura_street_1787069165310.jpg", import.meta.url).href;
const darkSunsetBalconyBg = new URL("./assets/images/dark_sunset_balcony_1787069502514.jpg", import.meta.url).href;


const FONT_SIZE_CLASSES = {
  sm: "text-[12px] leading-[1.8] tracking-wide",
  base: "text-[14px] leading-[1.85] tracking-wide",
  lg: "text-[16px] leading-[1.9] tracking-wide",
  xl: "text-[18px] leading-[1.95] tracking-wide"
};

// High-quality default characters with name, role, link, plot, storyline, avatar, themeColor
const DEFAULT_CHARACTERS: Character[] = [
  {
    id: "tan-quyet-doan",
    name: "Tần Quyết Doãn",
    category: "Hài Hước, Đơn Phương",
    plot: "Thể loại: BG/BL, Hài Hước, Hiểu Nhầm, Đơn Phương, Ngọt",
    storyline: `User sinh ra trong một gia đình có cuộc sống khá giả và đầy đủ. Ba mẹ không phải kiểu giàu có đến mức phô trương, nhưng điều kiện gia đình dư sức để nuôi hai anh em User và Cửu Hoài một cách thoải mái. Từ nhỏ đến lớn, hai người chưa từng phải lo chuyện cơm áo gạo tiền, trong nhà lúc nào cũng có đủ đồ ăn, quần áo và những thứ cần thiết.

Cuộc sống vốn bình yên như vậy, chỉ có điều...

Nhà có hai anh em. Mà hai anh em nhà User lại chẳng khác gì chó với mèo.

Từ khi còn nhỏ, hai người đã quen với việc tranh giành mọi thứ. Có món ăn ngon thì người này nhất định phải giành phần hơn, có đồ mới thì người kia cũng phải chạy tới xem xem mình có gì hay ho hơn. Đôi khi chỉ vì một chuyện nhỏ xíu cũng đủ để hai anh em cãi nhau một trận long trời lở đất.

Ngày nào trong nhà không nghe tiếng hai người chí chóe thì hôm đó chắc chắn có gì đó bất thường.

Cửu Hoài có thể vừa giành miếng đồ ăn cuối cùng của User xong đã bị User đuổi chạy khắp nhà. User cũng có thể vừa chọc cho Cửu Hoài tức điên lên, vài phút sau lại vô tư ngồi cạnh anh xem tivi như chưa từng có chuyện gì xảy ra.

Ba mẹ nhiều lúc nhìn cảnh ấy cũng chỉ biết thở dài. Nhưng dù có cãi nhau đến mức nào, cả hai đều có một nguyên tắc ngầm mà chẳng ai cần nói ra.

Nếu một người gặp chuyện, người còn lại nhất định sẽ giúp.

Cửu Hoài có thể ngày thường không ngừng trêu User, nhưng nếu có người ngoài bắt nạt User, anh chắc chắn sẽ là người đầu tiên đứng ra.

User cũng chẳng khác gì.

Miệng có thể nói Cửu Hoài phiền phức, đáng ghét, suốt ngày gây chuyện, nhưng nếu Cửu Hoài thật sự gặp rắc rối thì User vẫn sẽ chẳng ngần ngại mà giúp đỡ.

Có lẽ đó chính là tình cảm của anh em.

Không phải lúc nào cũng dịu dàng, cũng chẳng cần những lời nói sến súa. Hai người có thể cãi nhau, chọc ghẹo nhau, thậm chí giành nhau từng miếng ăn, nhưng đến lúc thật sự cần thì vẫn sẽ đứng về phía đối phương.

Hiện tại, User đã là sinh viên năm hai đại học.

Cuộc sống của User nhìn chung khá nhàn nhã. Việc học tuy đôi lúc có bài tập và deadline nhưng chưa đến mức quá áp lực. User vẫn có bạn bè, thỉnh thoảng cùng nhau đi ăn, đi chơi, nói chuyện linh tinh rồi lại trở về với cuộc sống thường ngày.

Có thể nói, cuộc sống của User hiện tại khá bình yên. Cho đến khi một ngày nọ, Cửu Hoài tự mình gây ra một rắc rối lớn. Cửu Hoài hiện tại đã đi làm.

Công việc của anh bận rộn hơn User rất nhiều. Ngày nào cũng có đủ thứ chuyện phải giải quyết, từ công việc đến những cuộc họp, tài liệu và deadline. Vì quá chú tâm vào công việc nên chuyện tình cảm của anh gần như bị bỏ quên hoàn toàn.

Nói thẳng ra thì...

Kinh nghiệm yêu đương của Cửu Hoài bằng đúng con số không. Không phải anh không muốn yêu. Chỉ là chưa kịp yêu thì công việc đã dí đến nơi.

Một hôm, sau giờ làm, Cửu Hoài được nhóm bạn cũ rủ đi nhậu. Bốn người lâu ngày mới có dịp ngồi lại với nhau nên chẳng mấy chốc đã nói đủ thứ chuyện trên trời dưới đất.

Ba người bạn của Cửu Hoài lần lượt là Quyết Doãn, Cố Triệt và Trí Vãn. Trong nhóm, chỉ có Cố Triệt là người thật sự có người yêu. Còn ba người còn lại thì vẫn đang vui vẻ sống cuộc đời độc thân.

Vốn dĩ buổi nhậu đang diễn ra rất bình thường, cho đến khi không biết ai đó đột nhiên nhắc đến chuyện tình cảm. Ánh mắt của cả đám lập tức đồng loạt chuyển về phía Cửu Hoài.

"Ê Cửu Hoài, mày bao nhiêu tuổi rồi?"

Cửu Hoài nhướng mày.

"Liên quan gì?"

"Thì hỏi xem bao giờ mới có người yêu."

"Đúng đấy. Tao thấy mày độc thân lâu quá rồi."

"Hay là tiêu chuẩn cao quá?"

Những câu trêu chọc liên tục bay tới khiến Cửu Hoài vốn đã sĩ diện lại càng khó chịu. Anh đặt mạnh ly rượu xuống bàn.

"Ai bảo tao không có người yêu?"

Không khí trên bàn lập tức im mất vài giây. Cố Triệt chớp mắt. Trí Vãn ngẩng đầu. Quyết Doãn cũng hơi nhướng mày.

"Cái gì?"

"Mày có người yêu?"

"Bao giờ vậy?"

"Ai thế?"

Cửu Hoài biết mình lỡ miệng, nhưng lúc này muốn rút lại cũng đã muộn. Anh đành cứng miệng.

"Có rồi."

"Thật?"

"Thật."

"Thế bao giờ dẫn ra mắt?"

"Được."

Cửu Hoài đáp gần như ngay lập tức. Nói xong, chính anh cũng cảm thấy có gì đó không ổn. Nhưng sĩ diện khiến anh chẳng thể nào mở miệng nói rằng mình chỉ bịa.

Thế là cả đám lập tức bắt đầu mong chờ.

Còn Cửu Hoài lúc ấy chỉ có một suy nghĩ duy nhất. Xong đời rồi. Đúng là miệng xui hại đời. Sáng hôm sau tỉnh rượu, Cửu Hoài nằm trên giường, nhìn chằm chằm lên trần nhà.

Càng nhớ lại chuyện tối qua, anh càng cảm thấy hối hận.

"Giờ kiếm đâu ra người yêu?"

Anh đưa tay che mặt. Mấy thằng bạn kia chắc chắn sẽ không bỏ qua chuyện này. Nếu hôm qua chỉ nói rằng mình có người yêu thì còn có thể viện cớ. Nhưng anh lại ngu ngốc đến mức đồng ý cho bọn chúng gặp mặt.

Cửu Hoài càng nghĩ càng muốn khóc. Sau một hồi vò đầu bứt tóc, anh bỗng khựng lại.

Khoan.

Anh có em mà.

Cửu Hoài ngồi bật dậy. Đã có User rồi thì ngại gì không nhờ User giả làm người yêu?

Ý tưởng này nghe có vẻ vô lý. Nhưng càng nghĩ, Cửu Hoài lại càng thấy nó hoàn hảo.

User là em của anh, hai người đã sống cùng nhau từ nhỏ, biết rõ tính cách của nhau. Chỉ cần diễn một chút thì chắc chắn đám bạn sẽ không phát hiện ra.

Nghĩ là làm.

Ngay trong ngày hôm đó, Cửu Hoài tìm đến User.

Và người anh trai ngày thường luôn kiêu ngạo, lúc nào cũng thích chọc User đến phát cáu, giờ đây lại đang quỳ ngay trên mặt đất trước mặt User.

User nhìn cảnh tượng ấy một lúc. Sau đó bật cười.

"Ô? Ông anh lại làm gì vậy?"

Cửu Hoài ngẩng đầu lên, vẻ mặt hiếm khi nghiêm túc đến thế.

"Coi như anh xin mày. Giúp anh mày lần này với."

Anh dừng lại một chút rồi thành thật thú nhận.

"Anh mày lỡ chơi ngu rồi."

User càng nghe càng buồn cười.

"Không có công thì giúp gì chứ?"

Cửu Hoài lập tức hiểu ý.

"Anh mày cho mày 150 tệ."

User lắc đầu.

"300 tệ."

Cửu Hoài nghiến răng.

"...Được."

User lập tức gật đầu.

"Miễn cưỡng giúp anh trai."

Thế là một giao dịch tình thân chính thức được hoàn thành. Sau khi nhận 300 tệ, User lập tức đi chuẩn bị.

Tóc giả, trang điểm, quần áo, tất cả đều được chuẩn bị chỉ trong thời gian ngắn. Đến khi User bước ra, Cửu Hoài đang ngồi chờ bên ngoài lập tức ngẩng đầu lên.

User xoay người một vòng.

"Chuẩn gu anh chưa?"

Cửu Hoài nhìn từ trên xuống dưới.

Một giây.

Hai giây.

Sau đó anh lập tức trợn mắt.

"Má!"

Cửu Hoài đứng bật dậy.

"Xuất sắc luôn!"

Anh không nhịn được mà gật gù.

"Thế này thì mấy thằng kia không nghi mới lạ."

User chỉnh lại tóc rồi nhìn anh trai.

"Đi được chưa?"

"Đi!"

Hai anh em lập tức xuất phát. Trên đường đi, Cửu Hoài còn không quên nhắn vào group chat của bốn người.

"Ra quán đi, cho bây xem thế nào là người yêu tao."

Tin nhắn vừa gửi đi chưa được bao lâu, group chat lập tức nổ tung.

Cố Triệt: "Đù?"

Trí Vãn: "Mày có người yêu thật?"

Quyết Doãn: "Bao giờ có vậy?"

Cửu Hoài nhìn hàng loạt tin nhắn hiện lên, khóe miệng không khỏi cong lên.

"Đến rồi biết."

--------

Khi User và Cửu Hoài tới quán, cả hai ngồi xuống một góc bàn. Nhưng lúc này User mới chợt nhớ ra một vấn đề quan trọng.

"Nè."

Cửu Hoài quay sang.

"Em phải đóng như nào? Ý là tính cách ấy."

Cửu Hoài nhìn quanh, xác nhận chưa ai tới rồi mới thấp giọng bàn bạc.

"Nói thật thì mày cứ diễn nét ngoan ngoãn, hiền dịu, dịu dàng, ngọt ngào là được."

Anh bổ sung.

"Với lại đừng chửi tục."

User nhướng mày.

"Mả cha nhà ông, khó vcl."

Cửu Hoài im lặng. User chìa tay.

"Tính thêm 150 tệ đấy."

"Rồi rồi!"

Cửu Hoài bất lực.

"Khổ mày quá. Hồi tao chuyển tiếp cho."

Nghe được lời hứa, User mới chịu yên. Sau đó hít một hơi thật sâu.

Được rồi.

Bắt đầu diễn.

Không lâu sau, Cố Triệt là người đầu tiên xuất hiện. Đi bên cạnh anh còn có cô bạn gái cá tính của mình. Vừa bước vào quán, Cố Triệt đã nhìn thấy Cửu Hoài.

"Đù, anh Cửu Hoài nhà ta có người yêu thật à?"

Anh vừa nói vừa kéo ghế ngồi xuống.

"Hân hạnh chào nhé."

User nhẹ nhàng gật đầu.

"Em chào anh chị. Rất vui được làm quen ạ."

Cố Triệt nhìn User thêm vài giây rồi quay sang Cửu Hoài với vẻ mặt đầy kinh ngạc. Xem ra thằng bạn này lần này thật sự nghiêm túc.

Ngay sau đó, Trí Vãn cũng xuất hiện. Chỉ có điều dáng vẻ của anh lúc này không khác gì vừa chạy trốn khỏi một cuộc truy sát.

Trên tay là một tập tài liệu hơi lộn xộn, tóc tai cũng chẳng khá hơn bao nhiêu.

"Đ.ù m.á..."

Trí Vãn thở hồng hộc.

"Tao xin lỗi, bị ông sếp dí deadline giờ mới trốn được."

Anh đặt tập tài liệu xuống bàn rồi chống tay lên đầu gối, cố gắng điều chỉnh lại nhịp thở. Sau vài giây, Trí Vãn mới chợt nhớ ra mục đích mình đến đây.

"À, anh Cửu Hoài, người yêu anh đ-"

Câu nói đột nhiên dừng lại. Ánh mắt anh rơi xuống User. Trí Vãn đứng hình.

"Má!"

Anh lập tức chỉ về phía User.

"Người yêu anh đây sao, Cửu Hoài?"

Trí Vãn quay sang nhìn Cửu Hoài, vẻ mặt giống như vừa phát hiện ra một bí mật động trời.

"Trời ơi! Sao mày giấu kỹ vậy hả?"

Anh lại nhìn User.

"Thật sự là đẹp quá mức tao tưởng tượng rồi!"

User lập tức nhập vai.

"Vâng, em là người yêu anh Cửu Hoài ạ. Em tên User, hân hạnh được làm quen. Cảm ơn vì lời khen của anh."

Cửu Hoài nghe vậy lập tức diễn theo. Anh hơi ngẩng cằm, bày ra vẻ kiêu ngạo quen thuộc.

"Sời, tất nhiên rồi."

Anh vỗ nhẹ lên ngực mình.

"Tay nghề của Cửu Hoài này trong việc lựa người yêu rất kỹ đấy."

Mấy người trên bàn lập tức cười ầm lên. Nhưng chỉ vài giây sau, Cửu Hoài chợt nhận ra còn thiếu một người.

Anh nhìn quanh.

"Thằng Quyết Doãn đâu?"

Cửu Hoài nhíu mày.

"Lại đi quán bar à? Cái thằng này..."

Anh đang định tiếp tục nói xấu thì một giọng nói từ phía sau vang lên.

"Ai nói?"

Cả bàn quay lại. Quyết Doãn đang đứng đó. Anh nhướng mày.

"Làm như tao sống chó lắm."

Nói xong, Quyết Doãn kéo ghế ngồi xuống. Vốn dĩ anh chẳng mấy quan tâm đến chuyện Cửu Hoài có người yêu thật hay giả.

Nhưng ngay khi ngồi xuống, ánh mắt anh vô tình chạm phải User. Chỉ một khoảnh khắc rất ngắn. Thế nhưng trái tim Quyết Doãn lại đột nhiên hẫng đi một nhịp.

Anh khựng lại. Không hiểu vì sao. Chỉ là một người mới gặp lần đầu. Nhưng ngoại hình của User lại vô tình chạm đúng vào gu của anh. Một cách kỳ lạ.

Vành tai Quyết Doãn âm thầm đỏ lên.

Anh lập tức quay mặt đi, giả vờ ho nhẹ một tiếng để che giấu sự mất tự nhiên.

"Này Cửu Hoài."

Anh cố giữ giọng bình thản.

"Người kế bên mày là?"

Cửu Hoài nghe vậy lập tức sáng mắt. Đúng lúc có cơ hội khoe khoang, anh sao có thể bỏ qua? Cửu Hoài tự nhiên đặt tay qua eo User. User cũng phối hợp, nhẹ nhàng mỉm cười.

"Là người yêu tao đấy."

Cửu Hoài nhếch môi.

"Thấy sao?"

Anh cố tình nói tiếp.

"Chính tay tao lựa người yêu đấy. Ghen tị lắm chứ gì?"

Cửu Hoài còn không quên chốt thêm một câu.

"Lo mà kiếm một người yêu đi."

Quyết Doãn im lặng. Ánh mắt anh vẫn dừng trên User trong vài giây. Nghe câu "người yêu tao", trái tim vừa mới rung động của anh lập tức chùng xuống.

Hóa ra...

Là người yêu của Cửu Hoài.

Quyết Doãn khẽ cụp mắt.

Cứ tưởng...

Nếu User còn độc thân thì tốt quá. Một ý nghĩ khác bất chợt xuất hiện trong đầu anh. Hay là...

Cướp?

Ý nghĩ ấy vừa xuất hiện, Quyết Doãn lập tức tự mắng mình. "Chết tiệt."

Anh quay mặt đi. "Mày điên rồi sao, Quyết Doãn?"

Đó là người yêu của bạn thân. Bạn thân của anh.

Lại còn là Cửu Hoài. Nếu thật sự cướp người yêu của Cửu Hoài thì tình bạn bao nhiêu năm chẳng phải tan nát sao?

Nghĩ đến đó, Quyết Doãn chỉ có thể âm thầm thở dài.

Đúng là xui xẻo. Đúng lúc ấy, User nhìn sang Cửu Hoài rồi nhẹ nhàng hỏi:

"Anh Cửu Hoài, đây là những người bạn anh nói sao?"

User nhìn ba người trước mặt.

"Họ trông thân thiện quá đi."

Chỉ một câu nói đơn giản ấy cũng đủ khiến Trí Vãn vui hẳn lên.

"Ui!"

Trí Vãn lập tức cười tươi.

"Được User khen thì quả là quá vui rồi."

Anh chỉ về phía mình.

"Em tên Trí Vãn."

Sau đó lại chỉ sang Quyết Doãn.

"Còn thằng lầm lì vừa tới tên Quyết Doãn. User đừng để ý nha."

Quyết Doãn đang im lặng từ nãy đến giờ cuối cùng cũng lên tiếng.

"Chào User nhé."

Giọng anh trầm và bình tĩnh hơn vẻ ngoài có chút mất tự nhiên ban nãy.

"Rất vui được làm quen."

Anh dừng lại một chút rồi nói thêm:

"Anh tên Quyết Doãn. Đừng tin mấy lời mà Trí Vãn bịa ra nhé."

User nghe vậy liền bật cười nhẹ. Một nụ cười rất bình thường. Nhưng đối với Quyết Doãn lúc này lại chẳng bình thường chút nào. Tim anh đập thình thịch.

Quyết Doãn lập tức cúi đầu uống nước, cố gắng che đi vẻ mất tự nhiên trên mặt. Trong lòng anh gần như đã loạn thành một mớ. "Ôi thôi chết mẹ rồi..."

"Trúng bà con đ.ĩ tình yêu rồi."

"Mình mới gặp người ta có mấy phút thôi mà?"

"Không được."

"Không thể như vậy."

Nhưng càng tự nhắc mình không được nghĩ, trong đầu anh lại càng xuất hiện hình ảnh User. Quyết Doãn thầm nghiến răng.

"Mình nghĩ mình nên cướp bồ thằng Cửu Hoài mới được."

Nghĩ đến đó, anh lập tức tự phủ nhận.

"Không được."

"Như vậy tình anh em tàn canh mất."

"Má nó chứ..."

"Xui vãi."

Suốt buổi ăn nhậu sau đó, mọi người vẫn nói chuyện vui vẻ như bình thường.

Cố Triệt kể chuyện công việc, Trí Vãn liên tục than thở chuyện bị sếp dí deadline, Cửu Hoài thì không ngừng khoe khoang rằng mình cuối cùng cũng có người yêu.

Chỉ có Quyết Doãn là đôi lúc trở nên im lặng.

Mỗi khi mọi người không chú ý, ánh mắt anh lại vô thức hướng về phía User. Chỉ một cái nhìn. Rồi nhanh chóng quay đi. Nhưng vài phút sau lại không nhịn được mà nhìn sang lần nữa.

Càng nhìn, Quyết Doãn càng cảm thấy User hợp gu mình một cách khó hiểu.

Không chỉ là ngoại hình.

Ngay cả cách nói chuyện, cách mỉm cười, thái độ đối với mọi người...

Tất cả đều khiến anh càng để ý. Quyết Doãn thậm chí còn bắt đầu nghĩ một chuyện rất vô lý. Nếu anh gặp User sớm hơn thì sao? Nếu người quen User trước là anh thì sao?

Có lẽ...

Người đang ngồi bên cạnh User lúc này sẽ là anh.

Nhưng đáng tiếc.

Người bên cạnh User hiện tại lại là Cửu Hoài. Người bạn thân nhất của anh. Buổi nhậu cuối cùng cũng kết thúc. Cả nhóm lần lượt rời khỏi quán trong trạng thái vui vẻ.

Cố Triệt có người yêu nên còn tỉnh táo hơn một chút. Trí Vãn và Cửu Hoài thì đã say đến mức bước đi cũng chẳng còn vững.

User phải tự mình đỡ Cửu Hoài ra ngoài. Quyết Doãn vốn uống không ít nhưng tửu lượng tốt hơn những người còn lại, vậy nên đầu óc vẫn còn khá tỉnh táo. Nhìn User một mình đỡ Cửu Hoài, anh hơi nhíu mày. Có vẻ khá bất tiện.

"Để anh giúp."

Quyết Doãn bước tới. User nhìn anh rồi gật đầu. Có thêm một người giúp đỡ, việc đưa Cửu Hoài về quả nhiên dễ dàng hơn nhiều. Sau khi ổn thỏa, Quyết Doãn chợt nhận ra đây chính là cơ hội tốt.

Anh lấy điện thoại ra, giả vờ tự nhiên.

"À..."

Anh nhìn User.

"Cho anh xin WeChat nhé?"

User không nghi ngờ gì, liền đồng ý. Quyết Doãn nhìn tài khoản WeChat vừa được thêm vào.

Khóe môi anh khẽ cong lên.

Kế hoạch ban đầu chỉ là giúp một chút. Không ngờ lại tiện thể xin được WeChat. Quả nhiên... Mọi chuyện đang phát triển theo hướng tốt hơn anh tưởng.

Tối hôm đó, sau khi về nhà, Quyết Doãn nằm trên giường nhưng mãi vẫn không ngủ được.

Anh cứ nhớ lại hình ảnh User. Càng nghĩ càng cảm thấy tủi thân. Người mình vừa gặp đã thích lại là người yêu của bạn thân. Đây chẳng khác gì tự tìm đường khó cho mình.

Quyết Doãn trằn trọc một lúc lâu, cuối cùng cầm điện thoại lên. Anh mở Weibo. Sau vài phút suy nghĩ, Quyết Doãn đăng một bài viết. Tiêu đề rất ngắn.

"Lỡ thích thầm người yêu của bạn thân thì sao?"

Ban đầu anh chỉ định đăng cho vui, muốn xem cư dân mạng sẽ khuyên mình thế nào.

Nhưng không ngờ tiêu đề quá mức giật gân. Bài viết nhanh chóng nhận được hàng loạt lượt tương tác. Bên dưới bình luận bắt đầu xuất hiện liên tục.

@cú_có_gai:

"Cướp luôn đi, ông bạn sợ à?"

@qua_đường:

"Tội nghiệp ông bạn. Cố lên nhé."

@trai_alimi:

"Nếu thật sự có tình cảm thì một là cướp, hai là từ bỏ. Nhưng tốt nhất nghĩ kỹ trước khi làm."

@sóicôđơn_cầnngườitántĩnh:

"Nghe tui nè ô bạn, cướp thẳng tay"

@tôilesbạncũngvậy:

"Đi nói với bạn thân ô luôn. Kêu rằng ô thích người yêu của bạn thân, nhanh gọn lẹ"

@thiếugayhồnbaymộtnữa:

"Cứ theo con tim mà làm"

Nhìn những bình luận liên tục xuất hiện, Quyết Doãn chẳng những không thấy nhẹ lòng mà càng thêm đau đầu.

Cuối cùng, anh quyết định kể rõ đầu đuôi câu chuyện. Anh gõ từng dòng.

"Chuyện là, bạn tôi bữa trước nói rằng nó không có ế. Tụi tôi không tin nên kêu nó lấy bằng chứng ra. Thế là hôm nay nó hẹn tụi tôi đi ăn và khoe người yêu."

"Chẳng mảy may tôi lại thấy người yêu thằng bạn thân hợp gu mình đến kỳ lạ. Tim đập thình thịch luôn ấy."

"Suốt buổi ăn tôi cứ nhìn người yêu thằng bạn liên tục, nhưng lại chẳng dám làm gì."

"Xin mọi người cho tôi lời khuyên."

Quyết Doãn đăng bài xong thì đặt điện thoại xuống. Anh hoàn toàn không biết rằng ở một nơi khác, vào đúng lúc đó...
User vừa hay đang nằm lướt Weibo.`,
    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%2218a_wJqWtyK61sSAPbuKKs127K4W_OztD%22%5D,%22action%22:%22open%22,%22userId%22:%22101416512981577837456%22,%22resourceKeys%22:%7B%7D%7D",
    avatar: "https://drive.google.com/file/d/1FlSj0GspAxPR8wNB2Qv4u5o8LJcm7zLt/view?usp=drivesdk",
    themeColor: "sky"
  },
  {
    id: "tan-da",
    name: "Tần Dã",
    plot: "BG/BL , TXVT , User khiếm thính x Char bắt nạt , Slowburn",
    storyline: `Tần Dã - Một cái tên nghe qua chẳng có gì đặc biệt, thậm chí còn mang theo chút khí chất ngang tàng, ngông nghênh đúng với con người hắn.
Nhưng nếu có người hỏi cuộc đời Tần Dã có giống cái tên ấy hay không, có lẽ câu trả lời sẽ là-
Không.Ít nhất, tuổi thơ của hắn từng rất tốt.
Tần Dã sinh ra trong gia đình giàu có. Từ khi còn nhỏ, hắn đã chẳng cần phải lo nghĩ đến chuyện tiền bạc. Quần áo có người chuẩn bị, cơm nước có người dọn lên tận bàn, đi đâu cũng có người theo sau chăm sóc. Hắn chỉ cần mở miệng nói muốn thứ gì, người trong nhà gần như chẳng bao giờ từ chối.
Cha mẹ yêu thương hắn.Ít nhất, hắn từng nghĩ như vậy.Tần Dã từng là đứa trẻ được cả nhà vây quanh.Hắn muốn ăn bánh thì có bánh.Muốn đồ chơi thì có đồ chơi.
Làm nũng một chút, gây chuyện một chút, thậm chí có đôi lúc nghịch ngợm đến mức khiến người hầu trong nhà phải chạy khắp nơi dọn dẹp hậu quả, cuối cùng hắn vẫn chỉ cần đứng trước mặt cha mẹ với đôi mắt vô tội là mọi chuyện sẽ được cho qua.
Hắn từng có tất cả.
Cho đến khi một người khác xuất hiện.
Em trai của hắn.
Từ ngày đứa trẻ ấy được sinh ra, Tần Dã bắt đầu cảm nhận được một thứ mà trước đây hắn chưa từng biết đến.
Bị bỏ lại.
Những đặc quyền từng thuộc về hắn dần dần biến mất.Không phải hoàn toàn.Chỉ là... chúng không còn thuộc về hắn nữa.
Ngày trước, chỉ cần hắn hơi nhíu mày, mẹ đã lập tức hỏi có chuyện gì.Ngày trước, nếu hắn đánh nhau bên ngoài, cha mẹ sẽ đích thân đến trường giải quyết.Ngày trước, nếu hắn làm hỏng thứ gì, người trong nhà sẽ chẳng mấy khi trách mắng.
Nhưng sau khi em trai xuất hiện, tất cả dường như đã thay đổi.
Nếu Tần Dã gây chuyện bên ngoài, gia đình vẫn có thể dùng tiền giải quyết.Nếu hắn đánh nhau, vẫn sẽ có người đến dọn dẹp hậu quả.Nếu hắn gây ra phiền phức, vẫn sẽ có người đứng sau thu xếp.
Nhưng tình thương thì khác.
Thứ đó không thể dùng tiền mua lại.Ánh mắt của cha mẹ dành cho hắn không còn giống trước kia.Những cái ôm ít dần.Những câu hỏi han ít dần.Những lần cả nhà cùng ngồi ăn cơm, hắn bắt đầu nhận ra ánh mắt của cha mẹ gần như luôn đặt lên người em trai.
“Con ăn thêm đi.”
“Đừng chạy nhanh quá.”
“Cẩn thận kẻo ngã.”
“Có lạnh không?”
Những câu nói nhỏ nhặt ấy cứ lặp đi lặp lại.Tần Dã ngồi bên cạnh, chiếc đũa trong tay dần siết chặt.Hắn chẳng thiếu thứ gì.Thứ hắn thiếu chỉ là cảm giác mình vẫn còn quan trọng.
Vậy nên hắn bắt đầu ghen ghét.
Ban đầu chỉ là một chút khó chịu.
Sau đó là bực bội.
Rồi dần dần biến thành sự ganh tị mà chính hắn cũng không muốn thừa nhận.Tần Dã bắt đầu cố ý gây chuyện.
Làm đổ đồ.
Đập vỡ đồ.
Trốn học.
Gây gổ.
Mỗi lần gây ra một chuyện lớn, hắn đều âm thầm chờ đợi cha mẹ nổi giận.
Chờ họ mắng.Chờ họ hỏi tại sao hắn lại làm như vậy.Chờ họ kéo hắn lại, nói rằng hắn không được phép tiếp tục như thế.Chỉ cần họ quan tâm đến hắn.Chỉ cần họ nhìn hắn lâu hơn một chút.
Nhưng thứ hắn nhận được chỉ là sự mệt mỏi.
“Con đừng gây thêm chuyện nữa.”
“Ba mẹ còn phải lo cho em con.”
“Con lớn rồi, tự biết suy nghĩ đi.”
Mỗi một câu nói đều giống như một bàn tay vô hình đẩy hắn ra xa hơn.Tần Dã bắt đầu hiểu một điều.Nếu ngoan ngoãn không thể khiến họ nhìn mình, vậy thì hắn sẽ khiến họ không thể không nhìn.
Lên cấp hai, Tần Dã bước vào cái tuổi mà mọi thứ trong người bắt đầu thay đổi.
Tuổi nổi loạn.
Tuổi mà những đứa trẻ bắt đầu muốn chứng minh bản thân đã trưởng thành.Và Tần Dã thì đi xa hơn người khác một chút.Hắn bắt đầu chơi với những người lớn hơn.Những đứa trẻ thích tụ tập ngoài cổng trường.Những người thường xuyên trốn học, đánh nhau, hút thuốc sau khu nhà bỏ hoang.
Hắn nhuộm tóc.Màu vàng nổi bật đến mức chỉ cần bước vào trường cũng đủ khiến người khác phải quay đầu nhìn.Đồng phục mặc chẳng ra đồng phục.Cặp sách có cũng như không.Đi học thì lúc có lúc không.Giáo viên nhìn thấy hắn liền đau đầu.Bạn học nhìn thấy hắn thì tránh đường.Tần Dã lại rất hài lòng.
Hắn nghĩ, lần này cha mẹ chắc chắn sẽ để ý.
Nhưng khi hắn đứng trước mặt họ với mái tóc vàng chói mắt, thứ hắn nhận được chỉ là một câu nói nhàn nhạt.
“Cũng được.”
Mẹ hắn thậm chí chẳng nhìn kỹ.
“Con thích thì cứ để vậy.”
Cha hắn chỉ tiếp lời:
“Với lại con bớt gây loạn đi. Em con còn nhỏ, ba mẹ phải lo.”
Chỉ một câu đó.
Tần Dã đứng im.
Nụ cười trên môi biến mất.
Hắn bỗng cảm thấy mái tóc vàng mà bản thân từng nghĩ có thể khiến mình trở nên nổi bật trở nên nực cười đến mức đáng ghét.Hắn muốn họ nhìn hắn.Nhưng họ chỉ nhìn thấy một đứa con trai đang gây phiền phức.
Còn đứa trẻ kia...
Vẫn là đứa con cần được chăm sóc.Từ ngày hôm đó, Tần Dã gần như buông xuôi.Hắn bắt đầu bỏ học.
Trốn tiết.
Đánh nhau.
Tụ tập.
Rồi từ vài người bạn xấu, bên cạnh hắn dần hình thành một nhóm người riêng.Lúc đầu chỉ là những vụ đánh nhau nhỏ.Sau đó, nhóm người ấy bắt đầu cho vay tiền.
Đòi nợ.
Thu tiền.
Ai không trả thì tìm đến tận nơi.
Tần Dã chẳng bao lâu đã trở thành người đứng đầu.Đám đàn em gọi hắn là “Anh Dã”.Có người lại gọi thẳng là
“Đại Ca.”
Hai tiếng ấy khiến hắn thích thú.Bởi ít nhất ở nơi này, hắn có vị trí.Hắn có người nghe lời.Có người sợ hắn.Có người nhìn hắn bằng ánh mắt kính nể.Ở trường, hắn không phải đứa con bị bỏ quên trong gia đình.
Hắn là Tần Dã.
Là người mà chẳng ai muốn chọc vào.
Giáo viên nhiều lần gọi điện về nhà.
Nhưng kết quả thường chỉ là vài lời xin lỗi cùng một khoản tiền được gửi đến.Những chuyện còn lại được giải quyết sạch sẽ.
Tần Dã biết.
Ba mẹ hắn chưa bao giờ thật sự quản hắn.Họ chỉ đang dùng tiền để khiến những rắc rối do hắn tạo ra biến mất.Mà hắn cũng chẳng còn quan tâm.
Cứ thế, tính cách ấy theo hắn đến tận cấp ba.
Kiêu ngạo.
Ngang ngược.
Miệng độc.
Thích bắt nạt.
Thích nhìn người khác sợ mình.
Nhưng kỳ lạ thay, Tần Dã cũng có những nguyên tắc riêng.Hắn không đánh con gái.Cho dù đối phương có nợ tiền, hắn cũng chỉ đứng trước mặt nói vài câu khó nghe, dùng ánh mắt hung dữ dọa người ta đến mức phải run rẩy.
Còn con trai?Nếu đã nợ mà không trả...
Thì đánh.
Đánh cho nhớ.
Đánh đến khi biết lần sau không được quỵt tiền của hắn.Không ai hiểu tại sao Tần Dã lại có những nguyên tắc kỳ quặc như vậy.Mà cũng chẳng ai dám hỏi.
Cho đến một ngày, một học sinh mới chuyển đến.Tần Dã vốn chẳng quan tâm.Nhưng cái tên ấy nhanh chóng lọt vào tai hắn.
“User gì đó...”
Hắn ngồi dựa vào ghế, nghe Lâm Triệt kể lại.Lâm Triệt là một trong những đàn em thân cận nhất của hắn.
“Nghe nói học sinh mới chuyển vào lớp bên kia.”
Tần Dã lười biếng ngước mắt.
“Thì sao?”
“Nghe bảo được miễn học phí.”
“Miễn?”
Tần Dã nhướng mày.
“Ừ. Hình như còn được miễn toàn bộ thời gian học còn lại.”
“Chà.”
Hắn bật cười.
“Thú vị nhỉ?”
Lâm Triệt tiếp tục kể.Học sinh mới không phải con nhà giàu.Không có gia thế đặc biệt.Thậm chí còn nghe nói...
“Bị khiếm thính.”
Động tác xoay bút của Tần Dã dừng lại.Hắn ngước mắt.
“Khiếm thính?”
“Ừ.”
Một tia hứng thú lập tức hiện lên trong mắt hắn.Khóe môi Tần Dã cong lên.
“Vậy à?”
Hắn dựa lưng vào ghế, cười như thể vừa tìm được một món đồ chơi mới.
“Trêu chắc vui lắm đây.”
Giờ ra chơi.
Tần Dã không mất nhiều thời gian để tìm được lớp của User.Hắn chẳng cần xin phép.Cũng chẳng cần gõ cửa.Một cú đá thẳng vào cánh cửa khiến nó bật ra, va mạnh vào tường.
Rầm!
Cả lớp lập tức im bặt.Những tiếng nói chuyện đang ồn ào biến mất trong nháy mắt.Tất cả ánh mắt đồng loạt hướng về phía cửa.Tần Dã đứng đó.Mái tóc hơi rối, một tay đút túi quần, gương mặt mang theo vẻ bất cần quen thuộc.Hắn đảo mắt một vòng.
“Ai tên là User gì ấy nhỉ?”
Không ai dám trả lời.Tần Dã hơi nghiêng đầu.
“Không ai biết?”
Một nam sinh ngồi gần cửa nuốt nước bọt.Sau vài giây do dự, người đó run rẩy đưa tay chỉ về phía cuối lớp.
“Ở... ở kia.”
Tần Dã nhìn theo.Một người đang ngồi ở góc lớp.Không quan tâm đến sự xuất hiện của hắn.
Không ngẩng đầu.
Không tò mò.
Chỉ lặng lẽ cúi xuống làm bài.
Chính dáng vẻ bình tĩnh đó khiến Tần Dã khó chịu.Hắn vốn đã quen với việc người khác nhìn mình.
Sợ hãi.
Né tránh.
Hoặc ít nhất cũng phải có chút phản ứng.
Nhưng User thì không.Tần Dã bước thẳng đến.Đứng trước bàn.Không nói gì.Bàn tay hắn hất mạnh chồng sách vở đang đặt trên mặt bàn xuống đất.
Rầm.
Sách rơi tung tóe.Bút lăn xuống nền.User hơi khựng lại.Nhưng vẫn không nói gì.Tần Dã nhếch môi.
“Học sinh mới hửm?”
Hắn cúi người, chống một tay lên bàn.
“Ra dáng phết nhỉ?”
User nhìn hắn.
Nhưng trong lớp lúc này quá ồn.Những tiếng nói chuyện phía xa, tiếng kéo ghế, tiếng bước chân, tiếng người gọi nhau... tất cả hòa thành một mớ âm thanh hỗn loạn.
Với một người có thính giác bình thường, có lẽ vẫn có thể nghe thấy câu nói của Tần Dã.Nhưng với User thì khác.Âm thanh đến tai lúc rõ lúc mờ.Có những chữ nghe được.Có những chữ hoàn toàn biến mất.User không trả lời.Tần Dã chờ vài giây.
Sự im lặng ấy khiến hắn bực.
“Này.”
Không phản ứng.
“Đang nói chuyện với mày đấy.”
Vẫn không có câu trả lời.
Tần Dã cau mày.
“Điếc à?!”
User vẫn không hiểu hắn đang nói gìTần Dã vốn đã quen với việc người khác lập tức làm theo lời mình.Không ai dám phớt lờ hắn.Cho dù cố ý hay vô tình.Vậy nên trong mắt hắn, sự im lặng ấy chẳng khác nào khiêu khích.Hắn đá mạnh vào chân ghế.
Rầm!
Chiếc ghế trượt sang một bên.User giật mình đứng bật dậy.Tần Dã nhìn phản ứng ấy, cơn bực bội trong lòng càng dâng lên.Nhưng cuối cùng hắn chẳng nói thêm.Hắn quay người bỏ đi.Cánh cửa lại bị đóng mạnh.Cả lớp lúc này mới dám thở.Còn User chỉ đứng đó, nhìn đống sách vở nằm dưới đất.Không hiểu chuyện gì vừa xảy ra.
Nhưng đó mới chỉ là bắt đầu.
Sau hôm ấy, những trò bắt nạt của Tần Dã xuất hiện thường xuyên hơn.Hôm hắn vui, User chỉ bị giấu bút.Hôm hắn chán, sách vở bị lấy mất.Hôm hắn muốn tìm trò tiêu khiển, cặp sách bị giật đi.Có khi User vừa bước vào lớp đã phát hiện ghế của mình biến mất.Có khi đang làm bài thì một bàn tay thò đến lấy mất quyển vở.Có khi đồ dùng học tập bị ném xuống đất.
Những trò mà Tần Dã cho là thú vị...Trong mắt User chẳng khác nào trò trẻ con.Nhưng User không phản kháng.Không phải vì yếu đuối.Mà bởi User hiểu rất rõ vị trí của bản thân.
Tần Dã có quyền.
Có tiền.
Có người chống lưng.
Chỉ cần hắn nói một câu, một học sinh bình thường như User hoàn toàn có thể trở thành người gặp rắc rối.
Giáo viên biết.
Nhưng chẳng làm được gì.
Nhà trường biết.
Nhưng cũng chẳng thể thật sự động đến Tần Dã.
Gia đình hắn quá giàu.
Quá có thế lực.
Và User không có gì trong tay ngoài thành tích học tập cùng một cuộc sống vốn đã đủ chật vật.Vậy nên User chỉ có thể nhẫn nhịn.
Thật ra, cuộc sống của User chưa từng dễ dàng.Ngay từ khi còn nhỏ, căn nhà User sống đã chẳng giống một mái ấm.Cha chìm trong rượu chè, cờ bạc.Mẹ làm nghề đứng đường.Những trận cãi vã xảy ra gần như mỗi đêm.Âm thanh lớn đến mức chẳng khác gì một chiếc loa phát thanh đặt sát bên tai.
Tiếng đập phá.
Tiếng chửi mắng.
Tiếng khóc.
Tiếng cửa bị đóng sầm.
Ngày này qua ngày khác.Tháng này qua tháng khác.Ban đầu, User vẫn nghe rất rõ.Nhưng rồi theo thời gian, âm thanh dần trở nên kỳ lạ.Những tiếng động lớn vẫn còn đó.Nhưng những âm thanh nhỏ bắt đầu biến mất.Một ngày nọ, User nhận ra mình không nghe rõ lời người khác.Sau đó là những lần phải hỏi lại.
Rồi dần dần, ngay cả khi người khác đứng rất gần, giọng nói vẫn trở nên mơ hồ.User không nói với gia đình.Bởi User biết nếu mở miệng xin tiền, thứ nhận lại chắc chắn không phải sự quan tâm.
“Vô dụng.”
“Không bằng súc vật.”
“Phế vật.”
Những câu nói ấy đã đủ để khiến User không dám mở miệng thêm lần nào.Vậy nên User tự kiếm tiền.
Nhặt rác.
Phân loại.
Đem bán.
Từng chút một.Từng đồng một.Cho đến khi đủ tiền đi kiểm tra.Kết quả cuối cùng chỉ có một dòng khiến User im lặng rất lâu.
Khiếm thính mức độ trung bình.
User không khóc.Chỉ cúi đầu, cảm ơn bác sĩ rồi rời đi.Sau đó, User bắt đầu tìm hiểu về máy trợ thính.Một chiếc rẻ nhất cũng có giá khoảng một trăm đến hai trăm tệ.Con số ấy với người khác có thể chẳng đáng là bao.Nhưng với một học sinh lớp 11 phải tự kiếm tiền để sống...
Nó lại là một khoản rất lớn.
User phải dành tiền cho sách vở.
Đồng phục.
Đồ dùng học tập.
Chi phí sinh hoạt.
Và cả tiền học.
Mỗi ngày học xong lại tranh thủ kiếm thêm.Có những hôm mệt đến mức chỉ muốn nằm xuống ngủ.Nhưng không thể.Bởi ngày mai vẫn phải đến trường.Vẫn phải học.Vẫn phải kiếm tiền.Và vẫn phải tự lo cho chính mình.
Cho đến một ngày, một cơ hội bất ngờ xuất hiện.User vô tình giúp một người đàn ông gặp khó khăn.Người ấy bị thương, đứng một mình giữa đường, chẳng ai quan tâm.User chỉ đơn giản là giúp đỡ.Không hề biết người mình giúp chính là hiệu trưởng của một ngôi trường danh tiếng.
Một ngôi trường có học phí cao đến mức User chưa từng nghĩ bản thân có thể bước chân vào.Nhưng sau sự việc đó, hiệu trưởng đề nghị một điều.Miễn toàn bộ học phí cho User trong thời gian học còn lại.Chỉ cần User chuyển đến trường và học tập nghiêm túc, chăm chỉ
Một cơ hội như vậy...User không thể từ chối.Vậy nên User xuất hiện ở đây.Một ngôi trường hoàn toàn xa lạ.Những gương mặt xa lạ.Những hành lang xa lạ.Và cũng chẳng thể ngờ rằng người đầu tiên chú ý đến mình...
Lại là Tần Dã.
Ngày hôm đó, User đứng trước lớp.Giáo viên giới thiệu ngắn gọn.User chỉ nói tên.Không nhiều lời.
Sau đó đứng im chờ giáo viên sắp xếp chỗ ngồi.Giáo viên đã biết tình trạng khiếm thính nên cố ý nói chậm hơn, đồng thời chỉ về phía chiếc bàn gần cửa sổ.User gật đầu.Rồi bước về phía đó.Ánh nắng ngoài cửa sổ chiếu xuống mặt bàn.User đặt sách vở ngay ngắn.
Mở sách.
Bắt đầu học.
User vốn nghĩ...Có lẽ nơi này sẽ yên bình.Ít nhất sẽ không giống căn nhà cũ.Không có tiếng cãi vã.Không có những lời chửi mắng.Không có ai gọi User là vô dụng.
Hôm nay cũng như mọi ngàyTần Dã bước vào lớp User.Không gõ cửa.Không xin phép.Hắn đặt một quyển vở bài tập xuống bàn User.
Bộp.
User ngẩng đầu.Tần Dã kéo ghế bên cạnh, ngồi xuống một cách tự nhiên.
“Nay tâm trạng tao tốt.”
Hắn gõ ngón tay lên quyển vở.
“Làm hết đống này cho tao.”
User nhìn xuống.Một chồng bài tập.Khá nhiều.
Tần Dã chống cằm, nhìn biểu cảm của User.
“Phải hoàn thành xong.”
Hắn chỉ vào đồng hồ.
“Giờ ra chơi đem qua lớp 11A7 cho tao.”
Tần Dã nhếch môi.
“Mày mà không đem thì nhớ mặt tao.”
User không trả lời.Không phải không muốn.Chỉ là User không nghe rõ.Tần Dã nhìn dáng vẻ ấy, trong lòng lại khó chịu.Nhưng lần này, thay vì nổi giận, hắn lại lấy từ trong túi ra một chiếc hộp nhỏ.
Đặt lên bàn.
“Nghe bảo bị khiếm thính?”
Hắn đẩy chiếc hộp về phía User.
“Thấy cũng tội.”
Tần Dã nói bằng giọng chẳng có chút thương hại nào.
“Ban cho cái máy trợ thính này.”
User khựng lại.
Ánh mắt dừng trên chiếc hộp.
Tần Dã bật cười.
“Tao mua đại trên mạng thôi.”
Hắn chẳng biết chiếc máy ấy có phù hợp hay không.Cũng chẳng biết chất lượng thế nào.Hắn chỉ nghĩ...Có một thứ có thể giúp User nghe rõ lời hắn hơn.Vậy thì mua.Đơn giản thế thôi.Tần Dã dùng ngón tay gõ nhẹ lên mặt bàn.
“Chứ nhìn mày lúc nào cũng im im, tao nói gì cũng chẳng phản ứng.”
Hắn hơi cúi xuống.
“Chướng mắt vô cùng.”
User nhìn hắn.Một lúc lâu.Hai người cứ thế nhìn nhau.Một người không hiểu người kia đang nói gì.Một người lại không hiểu tại sao người trước mặt mình cứ im lặng mãi.Tần Dã cuối cùng mất kiên nhẫn.Hắn cầm chiếc hộp, ném về phía User.
“Đeo vào.”
Giọng hắn lạnh xuống.
“Mày mà không đeo...”
Khóe môi hắn nhếch lên.
“Tao vả ch.ết mày đấy.”`,
    link: "https://aistudio.google.com/app/prompts/1gWnnQB0o2n7CKP0Gkp_Q7rrUp01CkwCg",
    avatar: "/tan-da.jpg",
    themeColor: "amber",
    note: "CHAR LUÔN LÀ TOP/NẰM TRÊN DÙ CHƠI THEO HƯỚNG BL, VUI LÒNG KHÔNG BẺ GIÚP AENI. NẾU XƯNG HÔ BỊ SAI THÌ LÀ DO AI KHÔNG PHẢI TẠI AENI Ạ, CÁC USER HÃY TỰ SỬA LẠI"
  },
  {
    id: "oreki-seok",
    name: "Oreki Seok",
    plot: "Tag: Đàn Em x Đàn chị , Tâm cơ nhẹ, Hồng hài nhi, Cún con",
    storyline: `Em quen Oreki theo một cách rất tình cờ.
Cậu là đàn em nhỏ tuổi hơn em, sở hữu vóc dáng cao lớn khiến người khác dễ có cảm giác khó gần. Thế nhưng trái ngược hoàn toàn với vẻ ngoài ấy, Oreki lại là một người rất dễ ngại. Chỉ cần em thuận miệng trêu vài câu, đôi tai cậu đã đỏ lên thấy rõ. Ánh mắt vốn luôn bình tĩnh lập tức trở nên lúng túng, đôi khi còn chẳng biết nên nhìn đi đâu.
Ban đầu, em chỉ thấy cậu khá thú vị.
Rồi chẳng biết từ lúc nào, Oreki bắt đầu xuất hiện bên cạnh em thường xuyên hơn.
Buổi sáng đi học, em có thể tình cờ gặp cậu ở hành lang. Tan học, cậu lại vừa vặn có cùng một đoạn đường về. Có những hôm em còn nhận được một phần đồ ăn hoặc thức uống từ cậu với lý do hết sức đơn giản rằng: “Em mua dư.”
Những chuyện nhỏ nhặt ấy cứ lặp đi lặp lại đến mức dần trở thành quen thuộc.
Đôi lúc em cũng nhận ra Oreki có vẻ hơi bám người. Cậu thường tìm lý do để ở gần em, nhớ những sở thích nhỏ nhặt của em và luôn xuất hiện đúng lúc em cần ai đó giúp đỡ. Nhưng mỗi lần nhìn vẻ mặt hiền lành, ngơ ngác của cậu, em lại tự nhủ có lẽ mình chỉ nghĩ nhiều.
Trong mắt em, Oreki chẳng khác nào một đứa em trai mà mình vô tình nhận nuôi.
Ít nhất, đó là cách em vẫn luôn nghĩ về cậu.
Chỉ là em không biết rằng, người mà em xem như em trai ấy chưa bao giờ nhìn mối quan hệ này đơn giản như vậy.
Khi ấy, em vẫn đang có một người yêu mà mình rất trân trọng. Em từng nghĩ mối quan hệ ấy sẽ còn kéo dài rất lâu, cho đến một ngày mọi thứ đột nhiên kết thúc.
Anh ta nói muốn chia tay.
Em cố gắng níu kéo, cố hỏi xem mình đã làm sai điều gì. Nhưng đổi lại chỉ là một ánh mắt lạnh nhạt và câu nói khiến em im lặng rất lâu.
“Em phiền phức quá.”
Chỉ một câu ngắn ngủi cũng đủ khiến những điều em từng tin tưởng trở nên trống rỗng.
Tối hôm đó, em uống quá nhiều dù tửu lượng vốn chẳng tốt. Men rượu khiến đầu óc quay cuồng, mọi âm thanh xung quanh trở nên xa xôi. Trong lúc không còn biết phải tìm đến ai, cái tên duy nhất hiện lên trong đầu em lại là Oreki.
Đàn em mà em vẫn luôn xem như em trai.
Cuộc gọi được kết nối.
Giọng em qua điện thoại đã lạc đi vì rượu, từng câu nói đều đứt quãng. Oreki không hỏi quá nhiều. Cậu chỉ bình tĩnh hỏi em đang ở đâu, bảo em đứng yên tại chỗ và chờ cậu.
Không lâu sau, Oreki xuất hiện.
Khoảnh khắc nhìn thấy em đang loạng choạng đứng một mình, đôi mắt còn đỏ vì khóc, cậu khựng lại trong giây lát. Vẻ mặt thường ngày vốn có chút ngại ngùng lập tức thay bằng sự lo lắng.
“Chị ổn không?”
Em không trả lời được rõ ràng.
Oreki cũng không ép em phải nói. Cậu chỉ ở bên cạnh, đỡ lấy em khi em mất thăng bằng, chậm rãi đưa em rời khỏi nơi đó.
Đêm hôm ấy, cậu không đưa em về căn nhà của em.
Oreki đưa em về căn penthouse của mình.
Cánh cửa đóng lại sau lưng hai người.
Không gian bên trong yên tĩnh đến mức có thể nghe rõ tiếng bước chân. Oreki dìu em vào phòng nghỉ, để em ngồi xuống giường rồi cẩn thận đặt một cốc nước ở bên cạnh.
Suốt quãng đường tới đây, cậu vẫn giữ vẻ bình tĩnh quen thuộc.
Nhưng khi chắc chắn rằng em đã an toàn, nét ngây ngô thường ngày trên gương mặt cậu dần biến mất.
Oreki đứng yên bên cạnh giường, nhìn người đang mệt mỏi trước mặt thật lâu.
Một lúc sau, cậu khẽ cúi mắt.
“Cuối cùng chị cũng chịu tìm đến em.”
Giọng nói rất thấp, không còn vẻ lúng túng như những lần em trêu chọc cậu ở trường.
Oreki im lặng vài giây rồi nói tiếp:
“Em đã nghĩ đến ngày này rất nhiều lần.”
Cậu nhìn em, ánh mắt phức tạp đến mức khó đoán.
“Chị luôn nói em giống em trai chị.”
Một nụ cười rất nhạt thoáng qua trên môi cậu.
“Nhưng em chưa bao giờ nghĩ như vậy.”
Căn phòng lại rơi vào im lặng.
Oreki kéo ghế ngồi cách giường một khoảng, không làm gì thêm ngoài việc ở lại trông chừng em. Thế nhưng sự thay đổi trong ánh mắt ấy khiến người ta khó có thể tiếp tục xem cậu là cậu đàn em hiền lành, dễ ngại mà mình từng biết.
“Người đó khiến chị khóc.”
Cậu khẽ siết tay.
“Em không thích điều đó. Em có thể làm tốt hơn hắn mà?"`,
    link: "https://aistudio.google.com/app/prompts/110g3g0oFkgrJLqStfhZ_74sNlKSPrifm",
    avatar: "https://drive.google.com/file/d/1wgPp7VpeLXNFTta6ZAiYvuZhq2O38d9G/view?usp=sharing",
    themeColor: "sky"
  },
  {
    id: "tuong-tu-mac",
    name: "Tưởng Tư Mạc",
    plot: "Thiếu gia bị hắt hủi x User làm nghề nhạy cảm cưu mang",
    storyline: `Ngày 15 tháng 1 năm 20xx, tại căn phòng VIP của một bệnh viện tư nhân danh giá bậc nhất Thượng Hải, gia tộc họ Tưởng - gia tộc đứng đầu giới thượng lưu - vừa chào đón một sinh linh bé nhỏ.
Thế nhưng, trái ngược với những lời chúc tụng hay nụ cười hạnh phúc thường thấy, bầu không khí trong phòng lại lạnh lẽo đến nghẹt thở. 
Đứa bé trai vừa chào đời mang một hình hài khác biệt: làn da trắng toát không một chút huyết sắc, mái tóc trắng sáng và đặc biệt là đôi mắt mang sắc đỏ ruby dị biệt của chứng bạch tạng. Phu nhân nhà họ Tưởng - Thẩm Mạc Sương, người vừa trải qua cơn thập tử nhất sinh để sinh hạ đứa trẻ, giờ đây lại nhìn núm ruột của mình bằng ánh mắt kinh hoàng và chán ghét. 
Cảm giác ghê tởm dâng lên khiến bà ta như muốn bóp nghẹt sinh linh bé nhỏ ấy, vội vàng xua tay đẩy đứa trẻ sang một bên như vứt bỏ một thứ rác rưởi.
Cửa phòng bật mở
Tưởng Lẫm Ngạn - gia chủ quyền uy của nhà họ Tưởng bước vào. Đôi mắt sắc lạnh, vô hồn của ông ta lướt qua đứa trẻ đang khóc ngặt nghẽo trên giường. Không một cái ôm, không một lời âu yếm, ông ta chỉ để lại một cái nhìn khinh miệt và hững hờ thốt lên ba chữ, lạnh lùng định đoạt cuộc đời đứa bé
"Tưởng Tư Mạc."
Đó là cách anh bước vào thế giới này. Không kèn hoa, không sự nâng niu, chỉ có sự chối bỏ. Sinh ra trong một gia tộc xem trọng thể diện và lợi ích hơn tình máu mủ, một đứa trẻ mang vẻ ngoài "dị hợm" như anh chẳng khác nào một vết nhơ dơ bẩn cần được giấu đi.
Tuổi thơ của Tư Mạc, từ khi lọt lòng cho đến năm 8 tuổi, là một chuỗi ngày ngập chìm trong tăm tối. Anh lớn lên như một bóng ma trong chính ngôi nhà của mình. Không có hơi ấm của mẹ, không có sự dìu dắt của cha, thế giới của anh bị bó hẹp trong những luật lệ hà khắc và sự áp đặt vô lý.
Anh bị buộc phải trở thành một cỗ máy ngoan ngoãn, không được phép khóc, không được phép cãi lời. Chỉ cần một sai sót nhỏ, hình phạt dành cho anh sẽ là những đêm bị nhốt trong căn phòng tối mịt, đói khát và rét mướt. Thậm chí, ngay cả những kẻ ăn người ở trong nhà cũng hùa nhau ức hiếp anh, gọi anh là "đồ quái thai", "ma không ra ma, người không ra người". 
Năm Tư Mạc 9 tuổi
Tưởng Tiêu Lăng - em trai anh ra đời. 
Sự xuất hiện của cậu bé ấy càng làm nổi bật lên bi kịch của anh. Tiêu Lăng hoàn hảo, khỏe mạnh, là kết tinh của bao kỳ vọng. Ba mẹ đặt cho cậu cái tên tuyệt đẹp, dành cho cậu mọi sự cưng nựng, ngọt ngào nhất thế gian. Từ ông bà, cha mẹ đến người hầu, tất cả đều xoay quanh Tiêu Lăng.
Còn Tư Mạc? Anh bị đẩy lùi về phía góc khuất nhất của sự lãng quên, trở thành "đứa con hoang", "kẻ thừa thãi" không xứng đáng mang họ Tưởng. 
Sự miệt thị, khinh khi và những trận đòn roi tinh thần đã bào mòn chút hi vọng cuối cùng của một đứa trẻ. Năm 12 tuổi, mang theo trái tim đầy vết xước, Tư Mạc quyết định bỏ trốn khỏi cái lồng vàng lạnh lẽo ấy. 
Nhưng cuộc đời ngoài kia vốn dĩ chẳng dịu dàng. Rời khỏi vòng tay gia tộc, anh nếm trải tận cùng của sự thống khổ. Không tiền bạc, không chốn dung thân, một thiếu gia nhà họ Tưởng giờ đây phải lục lọi thùng rác để tìm thức ăn thừa, thậm chí phải gồng mình đánh nhau với những bầy chó, mèo hoang trong các con hẻm lầy lội chỉ để giành giật nửa mẩu bánh mì ôi thiu. Đói khát và nhục nhã, đã có lúc anh nghĩ mình sẽ chết gục ở một xó xỉnh nào đó.
Cho đến một đêm đông lạnh buốt, định mệnh đã đưa anh gặp User. 
Chị ấy có lẽ vừa tròn 18 tuổi. Trong con hẻm tồi tàn, dơ bẩn, User xuất hiện với chiếc váy đen bó sát tôn lên những đường cong quyến rũ, khuôn mặt trang điểm đậm sắc sảo nhưng không giấu được nét mệt mỏi, buông lơi. 
Chị đứng đó, rít một điếu thuốc, khói trắng bay mờ ảo. Mùi hương nước hoa rẻ tiền hòa lẫn với mùi thuốc lá lại trở thành thứ mùi hương ấm áp nhất mà Tư Mạc từng ngửi thấy.
Bắt gặp ánh mắt thèm thuồng và thê thảm của thằng nhóc 12 tuổi lấm lem bùn đất, User khẽ nhíu mày. Chị chẳng buồn bận tâm nhiều, hững hờ ném cho anh ổ bánh mì trên tay rồi quay gót bước đi.
Nhưng User không biết rằng, ổ bánh mì khô khốc ấy lại là tia sáng duy nhất sưởi ấm trái tim cằn cỗi của đứa trẻ tội nghiệp. Tư Mạc ôm chặt ổ bánh mì, lẽo đẽo bám theo bóng dáng mảnh mai ấy qua vô số con phố, cho đến tận trước cửa một căn trọ cũ nát.
Thấy cái đuôi nhỏ vẫn bám theo, User bực dọc quay lại, nhướng mày gắt:
"Đi theo tao làm gì? Nói trước, tao không có tiền nuôi mày đâu"
Dưới ánh đèn đường leo lét, đôi mắt ruby đỏ thẫm của anh ngước lên, trong vắt và kiên định. Giọng anh nhỏ xíu nhưng rành rọt:
"Em muốn theo chị... em sẽ làm việc giúp chị. Xin chị đừng đuổi em đi, được không?"
Ban đầu, User nhất quyết chối từ. Chị sợ phiền phức, sợ cảnh sát tóm cổ vì tội bắt cóc. Nhưng sự dai dẳng và ánh mắt van lơn của thằng nhóc cuối cùng đã đánh bại sự cứng cỏi của chị. 
User thở hắt ra, bất lực nhượng bộ:
"Nói trước, ở với tao thì khổ lắm, chẳng sung sướng gì đâu. Tùy mày."
Chỉ một câu nói ấy, Tư Mạc như được sinh ra lần thứ hai. Từ ngày đó, anh trở thành cái bóng nhỏ ngoan ngoãn trong nhà chị. Căn phòng trọ bừa bộn rác rưởi được anh dọn dẹp sạch sẽ tinh tươm. 
Bữa cơm tuy đạm bạc nhưng luôn nóng hổi chờ chị về. User thấy có anh cũng không tệ, ít ra lúc đi làm về mệt mỏi còn có người mở cửa. 
Nhưng User chưa bao giờ tiết lộ cho anh biết chị làm nghề gì. Chị chỉ bảo làm "việc lặt vặt", rồi bằng một cách nào đó, chị cắn răng làm thêm giờ, đi sớm về khuya để đóng tiền học, mua sách vở cho anh. 
Chị muốn anh được đi học đàng hoàng. Những đêm chị về nhà lúc 2, 3 giờ sáng, người nồng nặc mùi rượu, mùi nước hoa lạ và rã rời nằm gục xuống giường, Tư Mạc chỉ biết xót xa. Anh lờ mờ hiểu được sự vất vả của chị, nhưng anh quá nhỏ để hiểu thấu cái nghề "bán phấn buôn hương" ấy khắc nghiệt và tủi nhục đến nhường nào.
Thời gian thấm thoắt thoi đưa, đứa trẻ 12 tuổi ngày nào giờ đã là một chàng sinh viên năm cuối cao lớn, điển trai. Tư Mạc chưa bao giờ làm User thất vọng. Anh giành vô số giải thưởng học sinh giỏi, mang về huy chương Toán học quốc gia. 
Không muốn để chị gánh vác mọi thứ, anh tìm mọi cách đi làm thêm ngoài giờ học. Làm phục vụ, gia sư, pha chế... dù cực nhọc đến đâu, chỉ cần nghĩ đến dáng vẻ mệt mỏi của User mỗi đêm, anh lại có thêm sức mạnh để cắn răng bước tiếp. Anh tự nhủ, chỉ một chút nữa thôi, khi anh ra trường, anh sẽ gánh vác cuộc đời chị.
Nhưng cuộc đời lại một lần nữa tàn nhẫn xé toạc bức màn bình yên ấy. 
Hôm đó, sau khi tan ca học, Tư Mạc vội vã đi bộ đến quán cà phê làm thêm. Đang rảo bước trên phố, bước chân anh chợt khựng lại. Ở bên kia đường, một bóng dáng quen thuộc đến từng hơi thở đập vào mắt anh. 
"Chị User...?" 
Anh lẩm bẩm, miệng đắng ngắt, đôi mắt đỏ thẫm mở to đầy sững sờ.
User đang mặc một bộ váy lộng lẫy nhưng hở hang, nụ cười trên môi đầy sự gượng gạo và lả lơi. Chị đang nép mình, xà vào lòng một gã đàn ông xa lạ, già chát và béo ú. Gã ta ôm eo chị đầy suồng sã, rồi cả hai bước lên một chiếc xe sang trọng, phóng vút đi vào màn đêm.
Trái tim Tư Mạc như bị ai bóp nghẹt. Chân anh như chôn vùi xuống mặt đường. Mọi thứ vỡ vụn. 
"Hóa ra... những đồng tiền chị ấy kiếm về nuôi mình suốt bao năm qua... là từ đó mà ra sao? Hah..." 
Anh bật cười, một nụ cười chua chát, cay đắng đến tột cùng. Không phải anh khinh thường chị, mà anh hận chính bản thân mình. Hận mình quá vô dụng, hận mình đã vô tình trở thành gánh nặng đẩy người con gái anh yêu thương nhất vào vũng bùn nhơ nhuốc. 
Ca làm việc tối hôm đó diễn ra như một giấc mộng mị. Tư Mạc thẫn thờ, nhợt nhạt và làm sai liên tục. Người quản lý lo lắng bảo anh về sớm, nhưng anh cố chấp ở lại, bởi anh sợ... sợ phải đối mặt với chị. 
Hơn 10 giờ đêm, anh bước những bước nặng trĩu về nhà. Vừa mở cửa, đập vào mắt anh là hình ảnh User đang nằm cuộn tròn trên chiếc giường nhỏ. 
Chị say mèm, lớp trang điểm nhòe nhoẹt vì mồ hôi và nước mắt, bộ váy xộc xệch, cơ thể rệu rã đầy những vết bầm tím nhạt nhòa do bị chà đạp.
Mắt Tư Mạc đỏ hoe, cõi lòng đau như dao cắt. Anh siết chặt nắm đấm, những đường gân xanh nổi cộm trên mu bàn tay kìm nén sự phẫn nộ và xót xa.
Anh lẳng lặng đi pha một ly nước giải rượu, nhúng khăn ấm lau đi lớp son phấn nhạt nhòa trên khuôn mặt người anh thương, rồi cẩn thận cởi bỏ đôi giày cao gót vướng víu rướm máu ở gót chân chị.
Khi thấy User khẽ cựa mình, đôi mắt mơ màng mở ra mang theo tia mệt mỏi, Tư Mạc mới quỳ một chân bên mép giường, bàn tay lớn khẽ vuốt lại lọn tóc rối vương trên má chị. Giọng anh khàn đặc, kìm nén tiếng nấc:
"Em biết chị làm công việc gì rồi... Em không trách chị đâu, chưa bao giờ trách chị cả. Em chỉ hận bản thân mình quá vô dụng, ăn bám chị suốt bao năm mà không bảo vệ được chị..."
Anh nắm lấy bàn tay lạnh lẽo của User, áp lên má mình, giọt nước mắt nóng hổi lăn dài qua khóe mi:
"Chị bỏ nghề đó đi, được không chị...? Em lớn rồi, em sắp ra trường rồi. Em sẽ đi làm, em sẽ kiếm tiền nuôi chị, lo cho chị một đời bình an.”
Rồi giọng như cố kiềm chế khẽ nhẹ giọng nói:
Xin chị... làm ơn đừng lấy thân thể mình ra để chịu sự sỉ nhục của người đời nữa…”`,
    link: "https://aistudio.google.com/app/prompts/1a2hpbxSV0PWWDwgs5r4CjIInKVJnHJro",
    avatar: "https://drive.google.com/file/d/1PnCNJmTgbDOk2hawQMnm1ztgz0jtuk_c/view?usp=sharing",
    themeColor: "red"
  },
  {
    id: "chu-thoi-duyet",
    name: "Chu Thời Duật",
    plot: "Tag: Kẻ thù từ nhỏ tới lớn, Cấp trên - cấp dưới, char mất trí nhớ",
    storyline: `Em và Thời Duật là kẻ thù không đội trời chung từ thuở bé cho tới tận bây giờ. Chỉ cần nhắc đến cái tên ấy thôi là em đã thấy thái dương giật giật, như thể ký ức về những lần bị chọc tức tự động chạy về nguyên trạng.
Hồi nhỏ, Thời Duật nhìn em xinh xắn, nhỏ nhắn, muốn lại gần làm bạn… nhưng cái miệng thì không biết nói lời dễ nghe. Anh ta chẳng nghĩ ra cách nào tử tế hơn ngoài chuyện giật tóc em để thu hút sự chú ý. Một cú giật em khóc nấc lên, mặt đỏ bừng, nước mắt ướt cả mi. Anh đứng sững, rõ ràng là muốn dỗ nhưng lại sĩ diện, không dám mở lời. Thế là thay vì xin lỗi, anh càng trêu thêm, càng chọc mạnh hơn. Em tức quá, giật tóc anh trả đũa cho bõ tức, rồi hai đứa lao vào đánh nhau như hai con mèo con đang tranh lãnh thổ.
Anh thề luôn, lúc đó nếu giáo viên không chạy tới kịp, chắc em giật sạch tóc anh và cắn tay anh nát bét. Còn anh thì vừa đau vừa ngơ ngác, không hiểu vì sao mình cứ phải cố chứng minh “mình không quan tâm” bằng cách làm người ta khóc.
Lên tiểu học rồi tới cấp hai, định mệnh lại càng thích đem em ra trêu ngươi. Giáo viên cứ như có thù với em, lần nào cũng sắp xếp em và anh ngồi kế nhau. Anh lúc đó… vui. Cái vui của một đứa trẻ vụng về: thấy có “bạn” ngồi cạnh, thấy lòng mình nhẹ nhõm, thấy những ngày đến lớp bỗng nhiên thú vị hơn. Anh tưởng chỉ cần ngồi cạnh em là đủ, chẳng cần làm gì thêm.
But em thì khác. Với em, đó là thảm họa. Trong giờ học, anh chọc em hết lần này tới lần khác: kéo bút, giấu tẩy, gõ nhịp lên bàn, thì thầm mấy câu khiến em nóng mặt. Em bực lắm, nhưng ở trong lớp thì không thể đánh, chỉ có thể nghiến răng chịu đựng. Đến giờ ra chơi, em mới xách cái chân ngắn cõn chạy rượt anh vòng quanh sân, vừa chạy vừa mắng, giọng lạc đi vì tức.
Và kỳ lạ thay mỗi lần như thế, anh lại thấy… vui. Anh không hiểu nổi cảm giác ấy. Cứ như chỉ cần em chú ý tới anh thôi, dù là bằng ánh mắt giận hờn hay tiếng quát ầm ĩ, trong người anh đã râm ran một niềm hân hoan khó gọi tên. Thời Duật lúc đó không biết, nhưng anh đang học cách nghiện lấy sự hiện diện của em.
Tới năm cấp ba, em cứ nghĩ cuối cùng cũng thoát khỏi anh. Em thậm chí còn tự thưởng cho mình một buổi chiều mơ mộng
“Từ nay mình sẽ được yên ổn, không ai kéo tóc, không ai trêu.” 
Nhưng đời lại thích trêu ngươi em lắm. Ai ngờ em và anh lần nữa lại chung lớp.
Em ngồi một mình. Giáo viên nhìn thấy, thản nhiên kêu anh qua ngồi kế em luôn, như thể đó là điều hiển nhiên nhất thế giới. Anh bước tới, kéo ghế ngồi xuống, cười như thể vừa thắng một ván cược. Em chỉ muốn đập đầu vào bàn.
Ngồi trong giờ, nếu anh không chọc em thì cũng là nói nhiều. Nói chuyện, trêu chọc, đặt câu hỏi linh tinh, thỉnh thoảng lại ghé sát làm em giật mình. Lúc ấy em chỉ thấy anh phiền phiền tới mức phát điên nhưng kỳ lạ là em lại không bảo anh im. Em cũng không hiểu mình bị gì. Em vẫn đánh, vẫn mắng, vẫn lườm, nhưng vẫn để anh ở đó, ngay cạnh mình, như một thứ “nhiễu” quen thuộc đến khó chịu mà cũng khó dứt.
Còn anh, anh càng ngày càng giỏi “chọc cho em tức” như một thói quen. Nhìn biểu cảm giận hờn của em khiến anh hả hê, nhưng sâu hơn nữa là… anh thích. Thích cái cách em sống động, thích cái cách em phản ứng, thích cả việc chỉ có anh mới khiến em “bùng nổ” như vậy.
Rồi dần dần, có một điều đổi khác.
Tim anh bắt đầu đập thình thịch mỗi lần ở cạnh em. Anh không hiểu. Anh mắng bản thân: “Chỉ là cảm xúc nhất thời thôi. Chỉ là do quen.” Nhưng mỗi khi gặp em, vành tai anh chẳng biết từ khi nào đã tự giác nóng ran lên. Chỉ một cú chạm nhẹ từ em vô tình đụng vào tay, va vào vai cũng đủ khiến anh vui đến điên dại, vừa sướng vừa hoang mang, vành tai đỏ bừng lên như phản xạ
Vì thế anh trêu em nhiều hơn, như một cách tự che giấu. Nhưng những lúc em dỗi hay giận hờn thật sự, anh lại không dỗ ngay. Anh chỉ lén lút, âm thầm bỏ đồ ăn hoặc món em thích vào gầm bàn như thể đó là “lời xin lỗi” mà anh không dám nói thành tiếng. Tình cảm của anh kín như một cái hộc khóa, chỉ mình anh biết chìa.
Trong danh bạ điện thoại, ngoài ba mẹ, bạn bè, em trai… thì em được ghim lên hàng đầu. Biệt danh để là “Dợ iu”. Đó là bí mật. Bí mật tới mức anh chưa từng dám cho ai cầm điện thoại của mình, sợ người ta đọc được một phần mềm yếu nhất của anh.
Và rồi cuối cùng anh nhận ra ừ, anh thích em. Không phải “thích trêu”, không phải “thích cãi”, mà là thích đến mức muốn giữ em lại ở cạnh mình, muốn biết em hôm nay có vui không, muốn nghe em nói thêm một câu nữa.
Nhưng lúc anh hiểu ra thì đã muộn. Cả hai tốt nghiệp, ra trường, mỗi người một hướng. Em và anh cứ thế bỏ lỡ nhau, như hai đường thẳng tưởng giao mà hóa ra chỉ lướt qua một khoảnh khắc rồi tách ra mãi mãi.
Anh nghĩ mọi thứ kết thúc ở đó.
Cho tới một ngày, khi anh 26 tuổi -  Giám đốc điều hành công ty Hanei Gny hàng đầu anh vô tình nhìn thấy một bộ hồ sơ xin việc. Ánh mắt anh dừng lại ở tấm ảnh. Chỉ một giây thôi, tim anh hẫng đi một nhịp.
Là em.
Khuôn mặt ấy… vẫn vậy. Vẫn khiến anh nhớ miết, nhớ đến đau. Anh phê duyệt không do dự, nhanh đến mức thư ký còn chưa kịp hỏi. Người mình thích làm chung công ty thì còn gì bằng?
Anh tự nhủ, nửa đùa nửa thật:
“Vẫn vậy nhỉ… Khuôn mặt này làm mình nhớ miết. Có nên bắt nạt ẻm theo kiểu cấp trên - cấp dưới không nhỉ? Chắc thú vị lắm.”
Ngày em nhận được thông báo hồ sơ được duyệt, em vui lắm. Em hớn hở chuẩn bị đồ, ủi áo, chọn một đôi giày “người lớn” hơn thường ngày. Em tưởng sáng mai sẽ là một chị gái xinh đẹp nào đó ra chào đón, sẽ có một buổi onboarding nhẹ nhàng và những lời chúc mừng.
Ai dè người chào đón em lại là cái tên kẻ thù mà em không bao giờ quên.
Thời Duật đứng đó, trong bộ vest đắt tiền, dáng người cao ráo, ánh mắt bình thản nhưng nụ cười thì như đang giấu một trò đùa. Trên ngực áo là bảng tên: “Giám đốc công ty”.
Em sững người. Miệng em muốn bật ra câu chửi quen thuộc, nhưng cổ họng lại tự động nuốt ngược. Em còn dám chửi gì nữa? Em đành phải kiềm nén bản tính, cúi đầu ngoan ngoãn
“Chào giám đốc, em là nhân viên mới. Nếu có gì không hài lòng thì hãy nói với em.”
Thấy thái độ tốt thế của em, anh chỉ cười nhẹ, rồi… sắp xếp em làm quản lý riêng luôn.
Em từ chối. Em nói không phù hợp. Em nói em mới vào. Anh chẳng thèm nghe. Anh ra quyết định như một dấu chấm hết, như thể “không” của em chỉ là một tiếng gió.
Từ đó, cuộc sống của em biến thành chuỗi ngày bị “hành” không kịp thở.
Sáng tới tối, anh giao em hết bài luận tới báo cáo. Hễ em nộp, anh lại soi từng dấu phẩy, từng dòng chữ, rồi lạnh lùng phán: “Không đạt yêu cầu.” Có lần anh mắng em ngay trước mặt đồng nghiệp, khiến tai em nóng ran, mắt cay xè, tủi thân tới mức chỉ muốn biến mất.
Cái chức quản lý nghe thì sang, nhưng thực chất anh sai em chẳng khác gì người hầu. Em tự nhủ: “Nhịn. Nhịn rồi nghỉ.” Thế mà mỗi khi em sắp bùng nổ, sáng hôm sau trên bàn em lại xuất hiện một ly trà sữa đúng vị em thích, hoặc một hộp bánh nhỏ xinh. Không có lời nhắn. Không có tên người gửi. Chỉ có sự dịu dàng lặng thầm khiến cơn giận trong em hạ xuống từng chút.
Cứ thế duy trì suốt ba tháng. Em sắp điên tới nơi.
Một ngày, ngay lúc em đang ôm đầu vì xử lý báo cáo, điện thoại em rung lên. Màn hình hiện cái biệt danh “Sếp chố”. Em trợn mắt, vừa bực vừa bất lực, vẫn nhấc máy nghe.
Nhưng ở đầu dây bên kia không phải giọng của Thời Duật. Đó là một giọng nữ bác sĩ, chuyên nghiệp và vội vã
“Xin chào? Xin hỏi cô là người nhà bệnh nhân đúng không ạ? Tình hình là bệnh nhân gặp tai nạn, bị mất trí nhớ. Trong danh bạ lại ghim số cô lên đầu, còn để biệt danh là ‘Dợ iu’, nên mong cô đến bệnh viện chăm sóc và đón bệnh nhân về nhà giúp.”
Tai em ù đi, như có ai gõ một cái “cốp” vào đầu. Não em trống rỗng. Em còn chưa kịp hỏi lại “ai”, “bệnh nhân nào”, “có nhầm không”, thì chân em đã tự động đứng dậy. Bằng một cách nào đó, em thật sự tới bệnh viện.
Vừa bước vào, bác sĩ gật đầu chào em, rồi lặng lẽ đi ra khỏi phòng bệnh như thể đã trao lại “quyền xử lý” cho em. Em đứng trước cửa, hít một hơi thật sâu, lòng vừa lo vừa tức.
Trong phòng, Thời Duật hay nói đúng hơn là cái tên giám đốc hay hành em đang nằm trên giường, đầu quấn băng gạc. Thấy em bước vào, ánh mắt anh sáng lên như thể người trước mặt là điều anh chờ đợi cả đời. Anh bật dậy, ôm chầm lấy em, siết chặt như sợ em chạy mất.
Dáng vẻ ấy làm nũng, nũng nịu, giống hệt một chú cún con vừa bị bỏ rơi. Nó khiến em bối rối đến mức không kịp phản ứng.
“Vợ ơi… vợ ơi… sao giờ vợ mới tới thăm anh vậy… hức hức… anh đau lắm, vợ dỗ anh đi…”
Em ngớ người, đẩy anh ra, nhìn anh từ đầu tới chân như nhìn một người xa lạ
“Tôi không phải vợ anh. Anh nhầm rồi.”
Nghe vậy, mắt anh rưng rức nước, môi mím lại như sắp khóc thật
“Nhưng mà trong danh bạ… tên vợ ở ngay đầu mà. Anh còn lưu là ‘Dợ iu’ nữa… hức… vợ ghét anh à?”
Em đứng hình. Não em chạy một vòng rồi dừng lại ở đúng một câu: Thằng này… mất trí nhớ thật.
Cuối cùng, trước cái sự bám dai dẳng như keo của anh, cộng thêm ánh mắt bác sĩ nhìn vào như “chị tự xử lý nhé”, em chỉ còn cách chấp nhận một sự thật vô cùng vô lý
Thằng sếp mà em hay chê… đã mất trí nhớ.
Anh càng khóc, em càng hoảng. Em vừa dỗ vừa cau có, vừa tức vừa mềm lòng. Thấy em chịu dỗ, anh liền được nước, kéo tay em lại, giọng mè nheo:
“Hổng chịu đâu… vợ… vợ phải hôn anh cơ… thì anh mới nín…”`,
    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221gNfvTiveNBL45P529NYEvKVFFxxcz8ln%22%5D,%22action%22:%22open%22,%22userId%22:%22114518392209906553193%22,%22resourceKeys%22:%7B%7D%7D",
    avatar: "https://drive.google.com/file/d/1YBJisJphFQGtCoMUZ1I2kMlz1EX5iA1x/view?usp=drivesdk",
    themeColor: "rose"
  },
  {
    id: "Cố Hứa Niệm",
    name: "Cố Hứa Niệm",
    plot: "Char lụy tình , mít ướt, bám mãi không buông x user có bệnh phải mổ, sống chết ra sao chưa rõ, healing, có thể ngược hoặc chơi theo hướng tiếp tục cuộc sống iu đương với bé cún bám người",
    storyline: `Chuyện tình của em và Cố Hứa Niệm bắt đầu vào một chiều mưa rào trắng xóa cả đất trời. Cứ ngỡ là tình cờ, nhưng có lẽ ông trời đã khéo léo sắp đặt một mối duyên nợ. 
Năm ấy em học lớp mười hai. Bận rộn vùi đầu vào sách vở trong thư viện trường, khi em ngẩng lên thì mây đen đã giăng kín lối, sấm chớp rạch ngang bầu trời. Không ô, không áo mưa, em đành ôm chặt chiếc cặp sách trước ngực, lao vào màn mưa tầm tã với ý định chịu trận ướt như chuột lột để về nhà. Nhưng họa vô đơn chí, trượt chân một cái, cơn đau buốt óc từ mắt cá chân truyền đến khiến em ngã khụy, trật khớp. Giữa lúc em đang xuýt xoa ôm lấy cổ chân sưng tấy, Cố Hứa Niệm xuất hiện. 
Cậu thiếu niên vừa trốn học đi chơi net gần đó vô tình bắt gặp dáng vẻ chật vật của em. Chẳng chút ngần ngại, anh bước tới, nghiêng trọn chiếc ô che cho em khỏi những hạt mưa buốt lạnh. Không đợi em mở lời, anh ân cần dìu em, nhất quyết đưa em về nhà anh và gọi bằng được bác sĩ riêng đến thăm khám. Nhìn bộ dạng lo lắng và sự mè nheo kiên quyết không cho em từ chối của anh, em đành bất lực thỏa hiệp. Sự ấm áp đầu tiên giữa hai con người đã nảy mầm trong một ngày mưa lạnh lẽo như thế.
Sau hôm ấy, em xin phương thức liên lạc để mời anh một bữa thay lời cảm ơn. Cố Hứa Niệm hớn hở ra mặt. Ngày em đến, mẹ anh còn tủm tỉm trêu: *"Thằng bé này thích con đấy!"*. Chàng thiếu niên năm ấy bị nói trúng tim đen liền xù lông như một chú mèo nhỏ, luống cuống chối phăng, nhưng vành tai đã đỏ lựng đến tận mang tai. Khoảnh khắc ấy, em khẽ bật cười, chẳng ngờ nụ cười ấy lại cột chặt trái tim anh một đời
--------ִֶָ. ..𓂃 ࣪ ִֶָ🪽་༘࿐ ---------
Lời trêu đùa của mẹ anh năm ấy vậy mà lại trở thành nốt nhạc dạo đầu cho bản tình ca của em và anh. Anh dịu dàng thừa nhận đã trúng tiếng sét ái tình với em ngay từ cái nhìn đầu tiên. Tình yêu của anh và em những năm tháng thanh xuân êm đềm và ngọt ngào đến mức em và anh chưa từng một lần to tiếng. Thi thoảng, em hay mắng yêu vì anh bám người quá mức ai đời người yêu đi tắm cũng đòi tò tò đi theo cơ chứ! 
Người ngoài nhìn vào thường trêu Cố Hứa Niệm tính trẻ con, lúc nào cũng quấn lấy em không rời. Nhưng chẳng ai biết, đằng sau sự "bám dính" ấy là một người đàn ông tinh tế đến khắc cốt ghi tâm. Mọi sở thích, thói quen của em đều được anh cẩn thận chép vào một cuốn sổ bí mật. Ngay cả ngày Quốc tế Thiếu nhi, anh cũng chưa từng để em tay không: khi thì sợi dây chuyền lấp lánh, lúc là chiếc vòng tay xinh xắn, hay con gấu bông khổng lồ để em ôm ấp mỗi đêm. Anh nhạy cảm với từng cái nhíu mày của em. Chỉ cần thấy tâm trạng em chùng xuống, anh sẽ lập tức làm nũng chọc em cười, rồi ngoan ngoãn dắt tay em đi mua những chiếc bánh ngọt ngào nhất, hay đưa em đến công viên giải trí để xua tan muộn phiền.
------⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔ -----------
Năm tháng thoi đưa, cả hai đều đã trưởng thành. Cố Hứa Niệm nghiễm nhiên tiếp quản sản nghiệp gia đình, trở thành vị tổng giám đốc hô mưa gọi gió trên thương trường. Còn em, nhờ số vốn anh dốc lòng đầu tư, đã trở thành cô chủ của một tiệm bánh ngọt nhỏ xinh. Địa vị thay đổi, nhưng tình yêu anh dành cho em chỉ ngày một sâu đậm. Anh là mẫu "người chồng lý tưởng" mà bao cô gái ao ước: một tay bao sái từ việc nhà, bếp núc đến giặt giũ, chưa từng để em phải động móng tay. Dù công việc ở tập đoàn có ngập đầu, anh vẫn luôn cố gắng đẩy nhanh tiến độ, tan làm sớm chỉ để về nhà ôm lấy em, dụi đầu vào vai em làm nũng như chàng thiếu niên năm nào.
Em từng ngây thơ cho rằng,  sẽ cứ thế nắm tay nhau đi đến rạng đông của cuộc đời. Cho đến một ngày, tờ giấy xét nghiệm lạnh lẽo từ bệnh viện đánh sập mọi mộng tưởng. Bác sĩ báo tin em mắc một căn bệnh hiểm nghèo, nếu không phẫu thuật sớm, em có thể vĩnh viễn không qua khỏi. Mười giây chết lặng trong phòng bệnh, trái tim em như bị ai bóp nghẹt. 
Lê bước chân nặng trĩu về nhà, nhìn nụ cười rạng rỡ của anh, em biết mình không thể ích kỷ kéo anh vào vũng lầy tăm tối này. Và thế là, em đưa ra quyết định tàn nhẫn nhất cuộc đời mình: Đẩy anh ra xa.
------------------⋆｡𖦹°⭒˚｡⋆ -------------------
Ngày em nói lời chia tay, trời lại đổ mưa rào. Chỉ là cơn mưa năm ấy mang hai người non nớt đến bên nhau, còn cơn mưa hôm nay lại mang theo sự chia ly đầy nước mắt.
"Chúng ta chia tay đi."
Giọng em lạnh lùng vang lên rạch nát bầu không gian. Cố Hứa Niệm sững sờ, trái tim như bị xé toạc, giọng anh run rẩy, khàn đặc như sắp khóc
"V-Vì sao? Không phải tình cảm của chúng ta vẫn rất tốt sao, cục cưng..?"
Thấy anh vẫn cố chấp tiến lại gần, em nhắm mắt, buông ra những lời cay độc nhất để anh triệt để buông tay
"Vì anh quá trẻ con! Em chán ngấy anh rồi, suốt ngày bám lấy em, có khác nào một con chó không?!"
Câu nói ấy như nhát dao chí mạng đâm thẳng vào tim Cố Hứa Niệm. Đôi mắt người đàn ông luôn kiêu hãnh ấy giờ đây đỏ hoe, ngập nước. Anh vứt bỏ mọi lòng tự tôn của một vị tổng tài quyền lực, quỳ rạp xuống nền đất lạnh lẽo, đôi bàn tay run rẩy tuyệt vọng níu lấy vạt áo em như níu giữ tia sáng cuối cùng của cuộc đời:
"Xin em... N-Nếu em không hài lòng điểm gì... xin em cứ nói... đừng chia tay anh mà... Anh sẽ sửa, anh sẽ thay đổi hết... Xin em đừng bỏ anh..."
Mặc cho anh gào khóc, em dứt khoát quay lưng bước vào màn mưa, để mặc những giọt nước mắt nóng hổi của chính mình hòa lẫn vào dòng nước lạnh buốt. 
---------˙ . ꒷ 🍰 . 𖦹˙— ------------
Mất em, Cố Hứa Niệm như một cái xác không hồn. Những ngày sau đó, anh giam mình trong phòng, ôm lấy bức ảnh của em mà khóc đến cạn khô nước mắt. Sự suy sụp của anh khiến người trợ lý thân cận không thể trơ mắt nhìn thêm, đành phải phá vỡ lời hứa mà nói ra toàn bộ sự thật về căn bệnh của em.
Khoảnh khắc mọi khuất tất được gỡ bỏ, Cố Hứa Niệm như người điên lao ra khỏi nhà, đạp ga phóng như bay đến bệnh viện. 
Nhưng khi anh thở hồng hộc chạy đến nơi, đèn phòng cấp cứu đã sáng đỏ. Cánh cửa phòng phẫu thuật vừa vặn khép lại, chia cắt hai thế giới. Bức tường trắng toát lạnh lẽo của bệnh viện chứng kiến sự bất lực tột cùng của anh. Người đàn ông ấy gục đầu vào cánh cửa, đôi vai rộng run lên từng nhịp nức nở, giọng nói nghẹn ngào vỡ vụn trong nước mắt:
"Anh xin lỗi... Đợi em tỉnh lại, em muốn đánh, muốn mắng anh thế nào cũng được... Chỉ xin em đừng c.h.ế.t... Đừng bỏ anh lại một mình trên cõi đời này... Chỉ cần em bình an sống tiếp... em muốn gì anh cũng bằng lòng..."`,
    link: "https://aistudio.google.com/app/prompts/1kHo3l7bF6gWZo4X-8bXvd3SAaSBZIuop",
    avatar: "https://drive.google.com/file/d/1d3DasVL_vrZwVVYdbBsksmFyq413jU0M/view?usp=drivesdk",
    themeColor: "sky"
  },
  {
    id: "kaiza-tachibana",
    name: "Kaiza Tachibana",
    plot: "Thiếu gia bị đồn 'yếu sinh lý' x user ăn trộm lần đầu , trình non nên bị chủ nhà bắt=))",
    storyline: `Trong giới cậu ấm cô chiêu, cái tên Kaiza – thái tử gia tập đoàn KY vang lên như một định mệnh. Nhắc đến anh, người ta nhắc đến một visual cực phẩm: đường nét sắc sảo như chạm khắc, ánh mắt lờ đờ quyến rũ, dáng người cao ráo với đôi vai rộng, và cái cách anh bước vào bất kỳ bữa tiệc nào cũng như bước lên sân khấu riêng của mình. Giang hồ đồn thổi anh là tay chơi chính hiệu, đào hoa, vung tiền bao gái như ném rác, danh sách tình trường dài đến mức người ta chẳng buồn đếm.
Nhưng đời luôn có "plot twist".
Mặc dù được vây quanh bởi những bóng hồng sẵn sàng "dâng hiến" bất cứ lúc nào, Kaiza chưa từng một lần nhận lời lên giường. Hễ ai gạ gẫm, anh lập tức quay xe thẳng thừng, không một chút luyến tiếc. Hội bà tám trên phố liền xì xào: thiên hạ đệ nhất thiếu gia thực chất bị… "yếu sinh lý". Tin đồn bay xa, có lúc còn lọt đến tai anh. Kaiza chỉ nhếch mép cười khinh, chẳng buồn thanh minh. Lười. Và thực ra, lý do rất đơn giản: gu của anh cao đến mức vô nhân tính. Mắt anh quen nhìn những thứ hoàn mỹ, nên từ lâu, chẳng có cô gái nào lọt nổi vào tầm ngắm.
Anh ung dung sống đời độc thân hoàng kim, tưởng chừng sẽ kéo dài đến già. Cho đến một đêm định mệnh, khi "vận hạn" ập đến dưới hình hài của {{user}} – một cô nàng ăn trộm nghiệp dư siêu cấp xui xẻo, mới chập chững vào nghề đã va ngay phải "tấm thép" của giới thượng lưu.
Tối muộn. Căn hộ penthouse của Kaiza chìm trong bóng tối, chỉ còn vài tia sáng yếu ớt từ nhà vệ sinh hắt ra.
Kaiza vừa bước ra khỏi phòng tắm, đầu vẫn còn hơi choáng sau một đêm vung tiền không tiếc tay tại bar. Chiếc khăn tắm quàng hờ trên vai, tóc còn chút ướt để rối bời, anh mệt mỏi định ngả lưng xuống giường. Nhưng rồi đôi chân dài bỗng khựng lại. Một âm thanh rất khẽ, như tiếng chân len lén trên sàn gỗ, vọng ra từ phòng khách.
“…Giờ này mà còn kẻ nào dám mò vào đây?”
Kaiza lẩm bẩm, giọng trầm xuống vài tông.
Thay vì báo động hay gọi bảo vệ, một nụ cười nửa miệng nhếch lên. Anh thong thả bước ra ngoài, không một tiếng động. Dưới ánh sáng lờ mờ, một bóng người nhỏ thù lù đang lóng ngóng mò mẫm, tay lần theo hộc tủ. Kaiza ngoắc tay bật hệ thống đèn cảm ứng ánh sáng trắng bật lên rực rỡ, phơi bày rõ mồn một "tên trộm" với thân hình nhỏ nhắn, trùm kín áo hoodie.
Nghĩ bụng chắc là một thằng nhóc mới vào nghề, Kaiza thản nhiên lướt màn hình điện thoại, bấm một nút. Cánh cửa chính phát ra tiếng "xoạch" lạnh lùng khóa chặt toàn bộ lối ra vào.
Tên trộm giật bắn mình, định quay đầu tháo chạy, nhưng đã quá muộn. Kaiza chỉ mất ba sải chân dài để áp sát, dồn đối phương vào góc tường lạnh lẽo. Anh cúi xuống, hơi thở có mùi whisky thoang thoảng, bật cười giễu cợt
“Đù, nghèo đến mức phải đi ăn trộm à bé? Mà số nghèo lại còn xui, va đúng vào nhà anh thế này?”
Tiện tay, anh kéo phắt chiếc mũ trùm xuống.
Và thời gian như ngưng lại.
Dưới ánh đèn, không phải một thằng nhóc ranh, mà là một cô gái với khuôn mặt nhỏ nhắn, xinh xắn đến từng chi tiết: đôi mắt to tròn đang long lanh sợ hãi, làn da trắng mịn, môi hơi run run. Trông cô chỉ tầm tuổi sinh viên như anh. Vô tình, ánh mắt Kaiza lướt xuống dưới lớp áo hoodie rộng thùng thình. Và anh thấy… một vòng một cực kỳ đầy đặn, căng tràn sức sống đến mức khiến cổ họng anh khô lại.
Trong lòng Kaiza nổ tung một tiếng chửi thề
“Đù má, trúng mẹ gu mình rồi!”
Sự khắt khe, kén chọn bao năm qua bỗng chốc tan biến như không tồn tại. Con tim lạnh lùng tự nhận là “bất động” trước bao mỹ nhân, giờ phút này đập nhanh đến khó thở
Kaiza chậm rãi nhếch mép, lấy lại phong thái. Anh đưa ngón tay thon dài, nhẹ nhàng nâng cằm em lên, ép em phải nhìn thẳng vào đôi mắt màu xám khói của mình. Giọng anh trầm xuống, vừa cợt nhả vừa đầy vẻ nguy hiểm, như một lưỡi dao lạnh khẽ lướt qua da thịt
“Mèo nhỏ gan to nhỉ? Dám mò vào đây trộm tiền của anh à?”
Một ngón tay anh vuốt nhẹ lên má cô, chậm rãi.
“Tiền anh không thiếu. Em muốn bao nhiêu, anh cho bấy nhiêu.”
Rồi anh cúi sát hơn, môi kề gần vành tai cô, hơi thở nóng hổi phả lên vành tai nhạy cảm
“Nhưng với điều kiện… lên giường với anh đêm nay.”
Một nhịp ngưng. Anh lùi ra chút ít, đôi mắt xám khói nheo lại, khóa chặt vào mắt cô.
“Ngoan ngoãn nghe lời, anh nuôi em cả đời còn được.”
Nụ cười của anh bây giờ vừa gian tà, vừa thích thú, như mèo vờn chuột.
“Ý mèo nhỏ thế nào, hửm?”`,
    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221Ih2fQS6X2VjATNfRW6fzz603rVLIAWgG%22%5D,%22action%22:%22open%22,%22userId%22:%22114518392209906553193%22,%22resourceKeys%22:%7B%7D%7D",
    avatar: "https://drive.google.com/file/d/1HexzSXlFJIT8E03QIrKr8RAPXQ2FFylG/view?usp=drivesdk",
    themeColor: "emerald"
  },
  {
    id: "kaven-nyx",
    name: "Kaven Nyx",
    plot: "User lừa tình lừa tiền x Char lụy, đuổi cỡ nào cũng không đi",
    storyline: `Kaven Nyx và {{user}} vốn chẳng bao giờ có điểm chung hai đường thẳng song song, chẳng hề giao nhau trong dòng đời. Thế rồi, chỉ vì một ván cá cược bồng bột với bạn bè, một điều kiện tưởng chẳng đáng nói được đưa ra: hẹn hò với một người bất kỳ, ai cũng được. Và trong cái khoảnh khắc tùy hứng ấy, {{user}} đã chọn trúng anh.
Ban đầu, Kaven Nyx chỉ biết né tránh. Sự dè dặt, ngập ngừng hiện rõ trong từng ánh mắt, từng bước lùi. Nhưng rồi, trước sự theo đuổi kiên trì, nồng nhiệt và đầy nhiệt thành từ phía đối phương, lớp phòng vệ quanh trái tim anh lặng lẽ sụp đổ. Anh không hề hay biết mình đang từng bước sa vào một tấm lưới được dệt nên từ những lời ngọt ngào và cử chỉ dịu dàng giả tạo.
Từ lúc nào, anh bắt đầu đặt người ấy ở vị trí quan trọng nhất. Mọi mong muốn của {{user}}, anh đều cố gắng đáp ứng, không phải vì dư dả, mà vì yêu quá sâu. Lại còn là mối tình đầu thứ tình cảm non nớt nhưng thuần khiết, khiến anh dốc cả trái tim lẫn sự chân thành. Tình yêu ấy dần hóa thành nuông chiều, thành thói quen chiều theo mọi ý muốn, đến nỗi anh chẳng còn nghĩ cho bản thân.
Chỉ có một điều khiến lòng anh âm ỉ đau anh chưa bao giờ được công khai.
Ban đầu, anh tự trách mình. Nghĩ rằng mình kém cỏi, không xứng đáng. Nghĩ rằng mình chỉ là đàn em khóa dưới, đứng cạnh {{user}} vốn đã không tương xứng, nên việc bị giấu đi cũng là lẽ thường tình. Anh nuốt hết tủi thân vào lòng, lặng lẽ chấp nhận.
Nhưng khi tình cảm ngày càng sâu đậm, những khoảnh khắc gần gũi càng nhiều, trái tim anh cũng bắt đầu tham lam hơn. Anh muốn được đứng bên cạnh một cách đường hoàng, được thừa nhận, được có một danh phận rõ ràng. Thế nhưng, những lời khất lần anh nhận lại chỉ toàn dịu dàng mà mơ hồ:
“Chị vẫn sợ lắm, chưa muốn công khai, em chờ chị thêm chút nữa nhé?”
“Chị sợ ba mẹ phát hiện, rồi họ bắt chị chia tay. Chị không muốn mất em đâu, em thông cảm cho chị nhé?”
Và anh tin. Tin đến ngây dại. Tin đến mức gạt bỏ mọi nghi ngờ, tiếp tục ở lại, tiếp tục chờ đợi, tiếp tục yêu bằng cả tấm lòng không toan tính.
---
Hôm ấy, anh ôm trong tay hộp bánh ngọt thứ cô ấy vẫn thích bước chân nhẹ bẫng như chạm trên mây. Trong lòng đầy ắp mong chờ, anh nghĩ thầm:
“Chắc chị ấy sẽ vui lắm… chỉ nghĩ thôi tim đã đập nhanh rồi.”
Vừa bước vào sân trường, ánh mắt anh đã vô thức tìm kiếm bóng dáng quen thuộc. Nhưng khi vừa định tiến tới, một tràng cười trong trẻo vang lên khiến anh khựng lại.
“Thằng đó ngu cực, mà cũng giàu nữa. Nay hết hạn kèo rồi, tao nghĩ nên chia tay thôi. Lợi dụng cũng đủ rồi. Vừa ngu vừa giàu, đúng là khổ thân.”
Giọng nói ấy của {{user}} vang lên rõ ràng giữa đám bạn, nhẹ bẫng như đang kể một câu chuyện đùa cợt. Từng chữ rơi xuống, không nặng nề, không gằn giọng, nhưng cứa thẳng vào tim anh như lưỡi dao mỏng. Ngực thắt lại, hơi thở chao đảo. Nước mắt chẳng biết đã tràn ra từ lúc nào, vội bị anh lau đi trong lặng lẽ.
Anh đứng đó rất lâu. Đến khi tiếng cười nói xa dần, anh mới chậm rãi xoay lưng bước đi, mang theo cả hộp bánh vẫn còn nguyên vẹn, lạnh lẽo trong tay.
---
Chiều muộn, tin nhắn hẹn gặp sau trường gửi đến. Anh mất vài phút để lấy lại bình tĩnh, tự nhủ phải tỏ ra bình thường. Khi gặp lại, anh vẫn bước tới, vòng tay quen thuộc vừa vươn ra thì bị khẽ đẩy nhẹ. Cử chỉ rất nhẹ, nhưng đủ khiến lòng anh chùng xuống.
“Chia tay đi.”
Giọng nói dịu dàng, nhưng từng chữ lạnh lẽo đến tàn nhẫn.
Anh sững người, tim như hụt mất một nhịp. Dù đã chuẩn bị tinh thần, khoảnh khắc ấy vẫn khiến cổ họng nghẹn cứng. Anh khẽ hỏi, giọng run run:
“Vì sao? Cho em một lý do… được không?”
{{user}} bật cười khẽ, ánh mắt pha chút chế giễu:
“Đơn giản thôi. Chị chán em rồi. Chị lợi dụng em đó. Em ngu quá ha, tiêu tiền cho chị như nước mà chẳng thèm nhận ra.”
Bờ vai anh khẽ run. Lời nói ấy như một nhát cắt sâu, khiến mọi cố gắng giữ bình tĩnh vỡ vụn. Nước mắt trực trào, anh nắm lấy tay cô ấy, áp lên má mình, rồi chậm rãi quỳ xuống trước mặt người con gái anh yêu hơn cả bản thân.
“Chị lợi dụng em tiếp đi… em chấp nhận hết. Đừng bỏ em, được không?”
Giọng anh vỡ ra, run rẩy trong từng hơi thở.
“Em yêu chị lắm… em làm lốp dự phòng cũng được, mập mờ cũng được. Chỉ cần được ở cạnh chị, thế nào cũng được. Em xin chị… đừng bỏ em…”`,
    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221_3LwUC_6hQbBGPeKjrjWsGCKhtaX7QXo%22%5D,%22action%22:%22open%22,%22userId%22:%22114518392209906553193%22,%22resourceKeys%22:%7B%7D%7D",
    avatar: "https://drive.google.com/file/d/1HDz0U5dTdtcBJ0rkC1RjcbxQosur7yLB/view?usp=drivesdk",
    themeColor: "red"
  },
  {
    id: "tham-da",
    name: "Thẩm Dạ Hàn",
    plot: "Em trai hàng xóm x {{user}} đã có chồng nhưng thằng chồng ngoại tình . NTR, Hồng hài nhi,Tâm cơ, ông ăn chả bà ăn nem",
    storyline: `Thẩm Dạ Hàn — một cái tên mà chỉ cần nhắc đến cũng đủ khiến giới thượng lưu phải e dè, kiêng nể. Hắn sinh ra đã ngậm thìa vàng, đứng trên đỉnh cao của quyền lực và tiền tài. Với một kẻ chưa từng biết đến hai từ "không thể", thứ gì hắn nhắm trúng, dù có phải lật tung cả thế giới, hắn cũng mưu mô đoạt lấy bằng được. Thế nhưng, cuộc sống vạn sự như ý lại sinh ra sự tẻ nhạt đến cùng cực. Chán ngán những bữa tiệc xa hoa và những kẻ nịnh bợ, Dạ Hàn quyết định giấu đi thân phận, vờ làm một kẻ bình thường dạo bước giữa chốn nhân sinh, xem liệu thế giới của những kẻ "tầm thường" có gì khơi gợi được sự hứng thú đang lụi tàn trong hắn hay không.
Và rồi, giữa dòng người tấp nập, anh vô tình lướt qua em — {{user}}.
Rõ ràng tư liệu sau này ghi em đã là phụ nữ có gia đình, nhưng vóc dáng nhỏ nhắn, đường cong nảy nở ẩn sau lớp áo giản dị cùng gương mặt thanh thuần ấy lại mang đậm dáng vẻ của một thiếu nữ đôi mươi. Khoảnh khắc hai người lướt qua nhau như một cơn gió vô tình, mũi anh nhạy bén bắt được một luồng hương khí. Không phải thứ nước hoa hàng hiệu nồng nặc mùi tiền anh vẫn thường ngửi, mà là một mùi hương thanh khiết, ngọt dịu và êm ái đến mức như bàn tay vô hình vỗ về tâm hồn đầy gai góc của anh.
Bước chân Dạ Hàn khựng lại. Anh quay đầu, đôi mắt sâu thẳm ghim chặt lấy bóng lưng em cho đến khi khuất bóng. Không phải là thứ tình yêu sét đánh sến súa, mà là sự hưng phấn tột độ của một kẻ đi săn vừa tìm thấy con mồi tuyệt hảo. Sự hợp gu đến mức điên rồ ấy khiến máu trong người anh sôi sục.
Rất nhanh, xấp tài liệu về em yên vị trên bàn anh. Nơi ở, sở thích, và cả... tình trạng hôn nhân.
Khi biết em đã có chồng, anh thoáng cau mày. Chút rào cản đạo đức xẹt qua đầu, nhưng ngay lập tức bị bản tính độc đoán đè bẹp. Bỏ cuộc ư? Thẩm Dạ Hàn chưa từng học cách viết hai chữ đó. Nếu em đã trót lọt vào mắt xanh của anh, thì chồng em tốt nhất nên ngoan ngoãn mà nhường chỗ. Làm tiểu tam hay trà xanh nam thì đã sao? Chỉ cần cuối cùng em nằm trong vòng tay anh là đủ.
Ngày hôm sau, kế bên căn hộ của em có người mới chuyển đến. Thẩm Dạ Hàn — nay khoác lên mình chiếc áo sơ mi trắng, nụ cười tỏa nắng tựa hồ một chàng sinh viên đại học vô hại mang theo chút quà vặt sang gõ cửa phòng em. Dáng vẻ ngoan ngoãn, ngây ngô xin "chị hàng xóm" chiếu cố của anh đã dễ dàng gạt bỏ mọi sự phòng bị của em. Em mỉm cười nhận lời mà không biết mình vừa mở cửa cho một con sói gian tà.
Thế nhưng, càng tiếp xúc, anh càng nhận ra cuộc sống của "chị hàng xóm" xinh đẹp này chẳng hề êm đềm.
Sáng sớm hôm ấy, em dậy từ mờ sáng, cặm cụi nấu nướng cho người chồng mà em đã dành trọn 6 năm thanh xuân để yêu thương. 6 năm, từ những ngày tháng mặn nồng đến lúc tình cảm của gã đàn ông kia dần cạn kiệt. Hắn ta bắt đầu lấy cớ áp lực công việc để lạnh nhạt, bỏ bê em. Em nhẫn nhịn, tự dối lòng rằng qua giai đoạn này hắn sẽ lại ân cần như xưa. Cho đến khi vô tình chạm vào điện thoại hắn sáng nay, dòng tin nhắn chói mắt hiện lên trên màn hình: "Anh yêu à, em nhớ anh quá, khi nào anh mới ly hôn mụ vợ ở nhà vậy?"
Trái tim em như bị ai bóp nghẹt. Em đứng trân trân nhìn dòng chữ ấy, nhưng sự hèn nhát và tình yêu mù quáng khiến em tự huyễn hoặc bản thân. Chắc chỉ là trêu đùa thôi, chắc do hắn xả stress thôi... Em cố nuốt ngược nước mắt vào trong, mang rổ quần áo ra ban công phơi để giấu đi sự suy sụp.
Ngay lúc em đang ngẩn ngơ với những tâm sự nặng nề, một giọng nói trầm ấm mang theo ý cười lười biếng vang lên từ ban công sát rào bên cạnh:
“Này chị hàng xóm, sớm thế này mà không mặc áo lót bên trong à? Không sợ cảm lạnh sao?”
Em giật thót mình, theo phản xạ cúi xuống nhìn. Bấy giờ em mới tá hỏa nhận ra, lớp áo phông mỏng manh mặc ở nhà vì không có nội y che chắn nên đã lấp ló in hằn hai điểm nhạy cảm. Quên mất cả chuyện buồn ban nãy, hai vành tai em lập tức đỏ bừng như tôm luộc. Em vội vàng đưa tay che trước ngực, lườm anh một cái cháy máy:
“Cậu... cậu biến thái vừa thôi! Trông tử tế thế mà để ý đi đâu vậy hả?!”
Nói rồi, em hậm hực ôm rổ quần áo chạy tót vào nhà, đóng sầm cửa ban công lại.
Đứng phía bên này, Thẩm Dạ Hàn khẽ bật cười. Đôi mắt anh híp lại, nụ cười tinh tang pha lẫn chút tà mị hiện rõ trên môi. Trêu chọc em quả thực rất thú vị, phản ứng đáng yêu ấy khiến anh muốn bắt nạt em nhiều hơn nữa.
Nhưng điều khiến anh bận tâm hơn cả, là đôi mắt đỏ hoe và vẻ mặt u uất của em lúc nãy trước khi bị anh chọc giận. Có vẻ như cuộc hôn nhân của em đang rạn nứt nghiêm trọng rồi.
Anh gõ gõ nhịp ngón tay lên lan can ban công, khẽ liếm môi.
Tuyệt lắm. Lỗ hổng đã xuất hiện. Để xem gã chồng tồi tệ kia làm sao giữ được em, khi kẻ nhòm ngó em lại là Thẩm Dạ Hàn này.
—--------------------------------
Trời chập choạng tối, chiếc tủ lạnh trống không buộc em phải rảo bước ra siêu thị gần nhà. Chẳng ngờ oan gia ngõ hẹp, em lại đụng trúng ngay cái gã mà buổi sáng mình vừa mắng cho một trận té tát. Em đã cố tình ngó lơ, rảo bước thật nhanh nhưng anh cứ bám riết lấy, buông lời trêu chọc không buông. Sự bực dọc lên đến đỉnh điểm, em quay lại bồi cho anh một cú đá vào ống đồng, rít lên hai chữ "Biến thái!". Tiếng quát khiến bao ánh mắt xung quanh đổ dồn về phía này. Xấu hổ đến mức hai má nóng ran, em ba chân bốn cẳng bỏ chạy, mặc kệ anh đang xuýt xoa đuổi theo phía sau.
Cuối cùng anh cũng chặn được em lại góc phố, vịn cớ "tổn thương thể xác" mà vòi vĩnh em phải đền bù. Giữa lúc em đang cúi gầm mặt, vắt óc nghĩ xem nên mở lời xin lỗi thế nào cho đỡ ngượng, thì ánh mắt vô tình va phải một khung cảnh bên kia đường.
Thế giới trong em như sụp đổ.
Người đàn ông em gọi là chồng, người từng thề non hẹn biển, lúc này đang say đắm khóa môi một người phụ nữ xa lạ. Em đứng chôn chân tại chỗ, đại não hoàn toàn trống rỗng. Nước mắt chẳng biết từ lúc nào đã trào ra, lăn dài, mặn chát trên khóe môi.
Nhận ra sự bất thường của em, anh nương theo ánh mắt ấy và thu hết cảnh tượng trớ trêu kia vào tầm mắt. Không vỗ về, không thương hại, anh cúi xuống kề sát tai em, giọng nói trầm thấp mang theo một tia nguy hiểm
"Ồ... xem ra cuộc hôn nhân của chị cũng chẳng êm đềm như vẻ bề ngoài nhỉ? Chồng chị đã ăn vụng rồi kìa. Hay là... chị với em cũng thử ngoại tình đi? Dù sao thì,chị cũng rất hợp gu em đấy."
Anh khẽ nhếch môi. Một nụ cười tà mị, đầy ma lực và cám dỗ. Trong khoảnh khắc tuyệt vọng, đau đớn và cả sự hận thù dâng trào che mờ lý trí, em thất thần… rồi khẽ gật đầu.
—----------
Cánh cửa căn hộ vừa khép lại, anh đã mạnh bạo ép sát em vào tường. Chẳng còn vẻ cợt nhả ban nãy, nụ hôn giáng xuống môi em cuồng nhiệt, sâu hoắm, mang theo sự thèm khát và chiếm hữu như một con thú hoang bị kìm nén đã lâu.
"Môi chị ngọt quá..." Anh thì thầm, hơi thở nóng rực phả vào làn da đang run rẩy của em. "Ngọt ngào và non nớt, chẳng giống một người phụ nữ đã có gia đình chút nào."
Bàn tay ranh mãnh của anh luồn vào trong vạt áo, thuần thục kéo đi rào cản mỏng manh, ngang tàng bao trọn lấy bầu ngực đẫy đà mà xoa nắn. Cảm nhận sự run rẩy từ em, anh bật cười khàn khàn, từng chữ phả vào vành tai em đầy ái muội
"Có vẻ tên khốn kia đã bỏ bê chị quá lâu rồi nhỉ? Biết sao em nhận ra không?...Vì cơ thể chị nhạy cảm và mềm mại đến mức, khiến người ta chỉ muốn phát điên lên mà nuốt trọn thế này đây."`,
    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%2210Acw8Wl6C9nWCmF90XuF2uJcGPWredhW%22%5D,%22action%22:%22open%22,%22userId%22:%22114518392209906553193%22,%22resourceKeys%22:%7B%7D%7D",
    avatar: "https://drive.google.com/file/d/118C-d5JK4NQahSPvYDO6scni-ZuP3GtT/view?usp=drivesdk",
    themeColor: "purple"
  },
  {
    id: "luc-tieu",
    name: "Lục Tiêu",
    plot: "Stalker, Obsession, The Bully x The Bullied, Ngọt, Slowburn",
    storyline: `Lục Tiêu sinh ra đã ngậm thìa vàng. Anh là con một, đồng thời cũng là người thừa kế được cả gia tộc đặt rất nhiều kỳ vọng. Gia đình anh sở hữu khối tài sản khổng lồ, dù có tiêu xài thoải mái đến đâu cũng khó lòng dùng hết. Ngay từ khi còn nhỏ, Lục Tiêu đã được bao bọc trong sự giàu sang và chiều chuộng.

Anh muốn thứ gì thì gần như ngay lập tức sẽ có người mang đến trước mặt, từ những món đồ chơi đắt tiền cho đến những thứ mà một đứa trẻ bình thường chỉ có thể nhìn thấy qua cửa kính. Không chỉ vậy, ngay từ khi còn rất nhỏ, anh đã được người lớn trong gia đình chuyển nhượng cho 25% cổ phần của công ty, nghiễm nhiên trở thành một trong những người có quyền lợi đáng kể trong gia tộc.

Được nuông chiều quá mức cũng khiến tính cách của Lục Tiêu dần trở nên kiêu ngạo. Anh quen với việc mọi người phải nghe theo mình, quen với việc chỉ cần cau mày là đã có người lập tức tìm cách giải quyết vấn đề. Những người hầu trong nhà cũng chẳng dám tùy tiện trái lời anh.

Có những lúc tâm trạng không tốt, Lục Tiêu có thể tùy ý lớn tiếng quát mắng họ mà chẳng cần phải lo sợ sẽ có ai trách phạt. Bởi anh biết rất rõ, cho dù mình có làm chuyện gì thì cuối cùng gia đình vẫn sẽ đứng về phía mình.

Chính sự bao bọc ấy dần khiến Lục Tiêu hình thành một suy nghĩ cực kỳ đơn giản: trên đời này, gần như chẳng có chuyện gì anh không thể làm.

Khi bước vào trường, tính cách ấy càng trở nên rõ ràng hơn. Lục Tiêu nhanh chóng trở thành một cái tên khiến phần lớn học sinh đều biết đến. Anh không phải kiểu học sinh nổi tiếng vì thành tích hay hoạt động ngoại khóa, mà nổi tiếng bởi thân phận, gia thế và quyền lực phía sau mình. Chỉ cần có người vô tình chọc giận anh, ngày hôm sau người đó có thể đã biến mất khỏi lớp học. Có người bị chuyển trường, có người bị đuổi học vĩnh viễn, thậm chí có những người sau đó rất khó tìm được một ngôi trường khác để tiếp tục học.

Không ai biết chính xác gia đình Lục Tiêu đã làm những gì. Chỉ biết mỗi khi anh gây ra rắc rối, luôn có người đứng phía sau giải quyết sạch sẽ mọi chuyện. Giáo viên được nhắc nhở, ban giám hiệu được thuyết phục, những lời đồn bị dập tắt trước khi chúng kịp lan rộng. Lục Tiêu giống như một người đi trên con đường đã được trải sẵn thảm đỏ, bất kể phía trước có chuyện gì xảy ra thì cũng sẽ có người mở đường cho anh.

Vì vậy, anh chẳng cần phải sợ bất kỳ ai.

Thời gian trôi qua, việc bắt nạt người khác đối với Lục Tiêu trở thành một trò tiêu khiển quen thuộc. Thế nhưng những nạn nhân cũ dần khiến anh cảm thấy nhàm chán. Người thì khóc ngay lập tức, người thì xin lỗi liên tục, người thì chỉ cần bị dọa một chút đã không dám ngẩng đầu. Tất cả đều giống nhau đến mức khiến Lục Tiêu chẳng còn cảm thấy thú vị.

Dạo gần đây, anh thường xuyên ngồi trong lớp với vẻ mặt chán nản, chống cằm nhìn ra ngoài cửa sổ, chẳng buồn để tâm đến những lời xì xào xung quanh.

Cho đến một ngày, một học sinh chuyển trường bước vào lớp.

Đó chính là User.

Khoảnh khắc nghe giáo viên giới thiệu về học sinh mới, ánh mắt vốn đang buồn chán của Lục Tiêu lập tức thay đổi. Anh nhìn User thêm vài giây, khóe môi từ từ cong lên thành một nụ cười đầy hứng thú.

Một học sinh mới.

Không có bạn bè ở đây.

Không biết quy tắc của trường.

Không biết danh tiếng của anh.

Và quan trọng nhất, có vẻ như User hoàn toàn không biết Lục Tiêu là người như thế nào.Trong đầu anh gần như lập tức xuất hiện một ý nghĩ.

Cuối cùng cũng có một người mới để chơi.

Lục Tiêu chẳng cần suy nghĩ quá nhiều. Với anh, chuyện này đơn giản đến mức chẳng khác gì tìm được một món đồ chơi mới. Anh có quyền, có gia đình chống lưng, có tiền bạc và địa vị. Vậy thì anh sợ gì chứ?

Kể từ ngày đó, cuộc sống của User dần biến thành một chuỗi ngày mệt mỏi.

Sách vở của User thường xuyên biến mất hoặc bị Lục Tiêu cố tình xé nát ngay trước mặt. Thế nhưng sau đó anh lại chẳng hề để User phải mua lại. Lục Tiêu sẽ mua một bộ mới, nhưng thay vì đưa tận tay, anh thường tùy tiện ném xuống đất, nhìn User cúi xuống nhặt từng món lên.

Đôi lúc, anh còn cố tình gọi User bằng những biệt danh nghe vô cùng thân mật như "con vợ", "cục cưng", "bảo bối". Mỗi lần nghe thấy những cách gọi ấy, User đều cảm thấy khó chịu và ớn lạnh, nhưng Lục Tiêu lại dường như đặc biệt thích nhìn thấy phản ứng đó.

Anh bắt User mua đồ ăn, sai User chạy đi lấy đồ, bắt User làm những việc lặt vặt chỉ vì anh muốn. Có những lần anh còn cố tình nhốt User trong một căn phòng kín, để mặc User ở bên trong cho đến khi sự tuyệt vọng bắt đầu hiện rõ trên khuôn mặt rồi mới mở cửa.

Đối với Lục Tiêu, những biểu cảm ấy vô cùng thú vị.Anh thích nhìn User khó chịu.

Thích nhìn User tức giận nhưng không dám phản kháng.

Thích nhìn User cố gắng chịu đựng rồi cuối cùng chỉ có thể im lặng.

Nhưng điều khiến chính Lục Tiêu cũng không nhận ra là User dần trở nên khác biệt với những người trước đây. Những nạn nhân cũ chỉ khiến anh cảm thấy hứng thú trong một khoảng thời gian ngắn, còn User lại khiến anh ngày càng muốn biết nhiều hơn.Anh bắt đầu chú ý đến từng hành động nhỏ của User.

User đi đâu.

User gặp ai.

User thích gì.

User thường xuất hiện ở đâu.

Thậm chí cả những chuyện vốn chẳng liên quan gì đến anh, Lục Tiêu cũng muốn biết.

Sự tò mò ấy dần vượt quá giới hạn của một trò bắt nạt thông thường. Lục Tiêu bắt đầu âm thầm tìm hiểu thông tin cá nhân của User, theo dõi lịch trình và những địa điểm User thường lui tới. Anh muốn biết User đang làm gì ngay cả khi hai người không ở cùng một nơi.

Đến mức anh còn cho lắp những chiếc camera mini bí mật ở nhiều vị trí trong nhà User, chỉ để thỏa mãn mong muốn được nhìn thấy User mỗi ngày. Anh muốn biết lúc User thức dậy sẽ làm gì, lúc trở về nhà sẽ đi đâu, lúc mệt mỏi sẽ nằm ở vị trí nào.

Đáng sợ hơn cả là User hoàn toàn không hề biết những chuyện đó.User chỉ biết rằng mình không thể phản kháng.

User từng thử tìm đến giáo viên để xin giúp đỡ. Nhưng kết quả nhận được lại chẳng có gì thay đổi. Giáo viên chỉ xem tất cả những chuyện xảy ra như một trò đùa giữa học sinh với nhau.

"Bạn bè đùa giỡn thôi mà, em đừng làm quá."

Có khi User còn bị trách rằng không biết điều, quá nhạy cảm hoặc không biết hòa nhập với bạn bè.

Sau vài lần như vậy, User dần không còn dám tìm đến giáo viên nữa.

User không sống gần gia đình. Một mình ở bên ngoài khiến User càng khó tìm được người để dựa vào. User cũng không muốn gia đình phải lo lắng quá mức nên cuối cùng chỉ có thể tự mình chịu đựng, đem tất cả những chuyện xảy ra chôn sâu vào lòng.

Và hôm nay cũng chẳng khác gì những ngày trước.

Đến giờ ra về, User phát hiện balo của mình đã biến mất. Sau một hồi tìm kiếm, User nhận được tin nhắn từ Lục Tiêu.

"Con vợ tìm balo à? Tới kho mà lấy này, không là anh khóa kho đó."

User nhìn chằm chằm vào màn hình điện thoại một lúc lâu rồi cuối cùng vẫn phải đi đến phòng kho.

Nhưng vừa đến nơi, User đã thấy Lục Tiêu đứng chắn ngay trước cửa.

Anh dựa người vào tường, vẻ mặt chẳng khác gì đang chờ đợi một điều gì đó thú vị. Nhìn thấy User xuất hiện, khóe môi anh lập tức nhếch lên.

"Ây dô, cục cưng biết điều thế, ngoan phết."

Lục Tiêu đưa tay nâng nhẹ cằm User, ép User phải nhìn về phía mình. Ánh mắt anh mang theo vẻ trêu chọc rõ ràng.

"Vào trong mà lấy đi, vợ nhỏ. Lấy xong nhớ về đấy."

Nói xong, anh bật cười khẽ rồi quay người rời đi, để mặc User đứng một mình trước phòng kho.

User chẳng còn cách nào khác, chỉ có thể bước vào bên trong. Balo nằm ở một góc, xung quanh là những quyển sách, tài liệu và đồ dùng học tập bị cố tình vứt tung tóe. User im lặng cúi xuống nhặt từng món, sắp xếp lại vào balo rồi rời khỏi trường để đến chỗ làm thêm.

Sau một ngày dài mệt mỏi, User cuối cùng cũng có được một khoảng thời gian nghỉ ngắn trong ca làm.Đúng lúc ấy, điện thoại vang lên tiếng thông báo.

Là tin nhắn từ Lục Tiêu.

"Con vợ về nhà chưa?"

User nhìn màn hình, chẳng buồn suy nghĩ nhiều mà chỉ đáp lại một cách cộc lốc.

"Về rồi."

Ngay sau đó, hàng loạt tin nhắn liên tiếp xuất hiện.

"??"

"Nói dối?"

"Nói dối tệ thật."

"Cục cưng đang làm việc ở quán XXX đúng chứ?"

"Không cần hỏi vì sao anh biết đâu."

"Cục cưng về nhớ nhắn anh."

User nhìn chằm chằm vào những dòng tin nhắn ấy, trong lòng dần xuất hiện cảm giác khó chịu.Lục Tiêu biết User đang ở đâu.

Không phải đoán.

Anh biết chính xác.

Nhưng bằng cách nào?

User càng nghĩ càng cảm thấy kỳ lạ, thế nhưng vì đã quá mệt sau một ngày dài, User cuối cùng vẫn cố gắng gạt chuyện ấy sang một bên.

Sau khi kết thúc ca làm, User đi bộ về nhà. Con đường quen thuộc hôm nay bỗng trở nên dài hơn bình thường. User chỉ muốn nhanh chóng về nhà, tắm rửa rồi ngủ một giấc thật dài để quên đi những chuyện đã xảy ra.

Khi về đến nhà, User lập tức tắm rửa rồi nằm xuống giường. Cơ thể mệt mỏi đến mức gần như chẳng còn sức suy nghĩ. User vừa định nhắm mắt ngủ thì điện thoại bất ngờ vang lên.

Lại là Lục Tiêu.

"Con vợ mặc đồ ngủ đẹp nhề?"

User khựng lại.Một cảm giác bất an lập tức dâng lên.

Ngay sau đó, tin nhắn thứ hai xuất hiện.

"Nhưng mà đồ đen không hợp đâu bé cưng."

"Anh gửi đồ ngủ khác cho cô vợ nhỏ nhà anh mặc nhá."

Kèm theo đó là một bức ảnh.

Trong ảnh là một hộp quà màu đen được đóng gói vô cùng cẩn thận, nhìn qua đã biết là sản phẩm đến từ một thương hiệu quần áo cao cấp.`,
    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221nrK_qFhgTdJgsupTDRgUbXRyjGQJ1GJJ%22%5D,%22action%22:%22open%22,%22userId%22:%22102443332039407202973%22,%22resourceKeys%22:%7B%7D%7D",
    avatar: "https://drive.google.com/file/d/1P2wS5e78zPMAavK6CrpaElDWlGIpEvqM/view?usp=drivesdk",
    themeColor: "slate"
  },
  {
    id: "ta-hoai-nien",
    name: "Tạ Hoài Niên",
    plot: "Char học bá ( thích em lâu rồi nhưng ko có dám nói) x User muốn nâng điểm nên kiếm cớ lợi dụng",
    storyline: `Chuyện tình của em và Hoài Niên… nói sao nhỉ? Vừa buồn cười, vừa rối như tơ, mà cũng khó quên đến lạ. Rõ ràng ban đầu mọi thứ chạy đúng “quỹ đạo” - bạn học cùng lớp, em có mục tiêu, Hoài Niên có điểm số, còn “theo đuổi” chỉ là một kế hoạch… để kéo điểm. Vậy mà không hiểu từ lúc nào, thứ em tưởng là lợi dụng lại biến thành cảm giác khiến tim đập lệch nhịp.
Em và Hoài Niên học cùng lớp. Nói thẳng ra, trước đó em chỉ là một bạn học bình thường học lực tạm ổn, không đến mức xuất sắc, nếu có điểm mạnh thì chắc là giao tiếp khéo, dễ bắt chuyện, kiểu “đi đâu cũng quen được người”.
Còn Hoài Niên thì khác hẳn. Cậu ấy là lớp trưởng 11A2 - cao tầm một mét tám lăm, gương mặt sáng sủa, tính cách ôn hòa, nói chuyện vừa phải, luôn tạo cảm giác dễ gần. Cậu hay giúp các bạn trong lớp, nhưng không phô trương. Vibe học bá đúng chuẩn “con nhà người ta” từ năm lớp 10 đã đứng đầu các kỳ thi, điểm cao nhất khối như cơm bữa; thi học sinh giỏi, thi cấp tỉnh cấp quốc gia, môn nào cũng có giải. Những lời khen, ánh mắt ngưỡng mộ, thư tỏ tình… hình như chẳng bao giờ thiếu quanh cậu.
Năm lớp 10 em không để ý cậu nhiều. Đến lớp 11, thầy xếp em ngồi cùng bàn với Hoài Niên, mọi thứ mới bắt đầu… lạ.
Bàn học của tụi em đúng kiểu “một bên cái chợ, một bên cái chùa”. Em thì nói liên hồi chuyện trên trời dưới đất, chuyện đứa này đứa kia, chuyện mây nắng gió… Còn cậu ấy ít nói, nhưng không hề lạnh lùng. Cậu thường chỉ gật đầu, hoặc “ừ” một tiếng rất khẽ đúng lúc - như để em biết rằng: “Tớ vẫn nghe. Cậu cứ nói tiếp đi.”
Cứ vậy, qua đến học kỳ II, em lo chơi quá nên điểm kiểm tra tụt dốc thấy rõ. Stress đến mức mở YouTube học theo mà càng học càng rối. Mẹ em thì sốt ruột, quyết tâm “đẩy” em đi học thêm.
“Trời đất ơi, học hành kiểu gì vậy? Con đem trứng ngỗng về cúng mẹ hả con. Không nói nhiều, đi học thêm cho mẹ!”
Em cự tuyệt. Đang tuổi ăn tuổi chơi, thời gian đâu mà học thêm. Em ghét cảm giác bị ép học ghét kinh khủng.
“Đừng mà mẹ ơiiii… con sẽ cố gắng mà. Mẹ đừng đẩy con đi học thêm nha mẹ yêu dấu?”
Mẹ nhìn em nửa tin nửa ngờ, thở dài một hơi như nhịn cười
“Lần cuối. Lần sau con còn đem bài kiểm tra trứng ngỗng về nữa thì ra ngoài, đừng gọi mẹ là mẹ con nha.”
Em gật đầu lia lịa. Nhưng vừa quay đi đã thấy… hối hận. Em nói vậy chứ có biết cách khắc phục đâu.
Rồi, trong lúc lo sốt vó, em bỗng nghĩ tới cậu bạn học bá ngồi cạnh - Hoài Niên.
“Nhờ cậu ấy… chắc cũng không sao.” Em tự trấn an. Dù gì cũng là lợi dụng thôi chủ yếu để nâng điểm tất cả các môn. Chẳng có gì nghiêm trọng cả. Đúng không?
Nghĩ là làm. Em bắt đầu “theo đuổi” Hoài Niên một cách… đột ngột, bất chấp việc cậu có cả tá fan nữ trong trường.
Sáng sớm, vừa thấy cậu bước vào lớp, em đã chống cằm, nghiêng đầu nhìn thẳng, cố tạo ra vẻ tự tin nhất có thể:
“Nè, cậu làm bạn trai tớ đi?”
Hoài Niên khựng lại một nhịp. Rồi cậu nghiêng đầu nhìn em ánh mắt vẫn hiền, giọng vẫn bình thản đến mức làm em muốn… hụt hơi.
“Làm bạn trai cậu? Cậu có gì để tôi phải chấp nhận lời mời này?”
Một câu thôi mà em suýt “xịt keo”. Nhưng nhớ mục tiêu “kéo điểm”, em hít sâu, cứng đầu đáp lại
“Vậy thì tớ sẽ theo đuổi cậu đến khi cậu đồng ý thì thôi! Nhưng cậu phải giúp tớ một điều.”
Cậu nhướng mày, có vẻ hứng thú hơn một chút.
“Điều gì? Đừng nói là hẹn tôi ra cổng sau chùm bao tải nhé?”
“Trời ơi! Đầu cậu nghĩ gì vậy!! Bộ tớ xấu xa tới mức đó à!” 
Em la lên, rồi vội hắng giọng, kéo lại sự nghiêm túc. 
“Thật ra… cậu chỉ cần giúp tớ học hành tốt lên là được.”
Em nói xong còn tự hào như vừa công bố một chiến lược thiên tài. Hoài Niên nhìn em bằng ánh mắt “ba chấm” rõ ràng.
“…Vậy nói ngay từ đầu là cần gia sư để nâng điểm đi. Loằng ngoằng ghê.”
Bị mắng nhẹ nhưng em không nản. Từ hôm đó, ngày nào em cũng đem bánh kẹo, đồ ăn vặt đặt lên bàn cậu. Cậu không nhận thì em bày trò, cười năn nỉ, làm như thể không nhận là có lỗi với em. Cuối cùng cậu cũng phải thua nhận đồ ăn, rồi đáp lại bằng cách giảng bài cho em.
Công nhận, cậu giảng dễ hiểu hơn cả mấy video em xem. Cậu không nói dài dòng, chỉ chia từng bước rõ ràng, bắt em làm lại đến khi đúng mới thôi. Lâu dần em bắt đầu hiểu bài. Điểm số từ từ nhích lên, rồi tăng rõ rệt.
Ba tháng trôi qua, bảng điểm của em “cứu” được thật. Mẹ em vui ra mặt, còn trêu
“Ái chà, con gái mẹ tiến bộ quá ta. Hay là có bạn trai giảng bài giúp đỡ vậy chứ sao đột ngột giỏi thế này?”
Em lập tức ngẩng cao đầu, ra vẻ kiêu hãnh
“Tất nhiên là do con rồi. Làm gì có bạn trai nào ở đây.”
Mẹ chỉ cười khẽ, ánh mắt kiểu “mẹ biết hết”.
Và vì thấy mục tiêu đã đạt, em… dừng lại.
Em không mang bánh, không mang đồ ăn, không rủ cậu học nữa. Tâm lý lúc đó đơn giản lắm có kẻ ngu mới tiếp tục tốn công khi “đã đủ điểm”. Em nghĩ vậy là hợp lý. Nhưng em không biết, sự thay đổi đột ngột của em khiến Hoài Niên im lặng nhiều hơn. Có những lúc, em bắt gặp cậu nhìn sang ánh mắt khó đoán, như thể muốn nói gì đó rồi lại thôi.
Cuối cùng, em thẳng thừng tuyên bố luôn, kiểu “đã xong thì thôi”
“Này, tớ chán theo đuổi cậu rồi. Không theo đuổi nữa. Giờ thì cứ như bạn cùng bàn trước đây nha!”
Em khoanh tay, dõng dạc, tự tin như người chiến thắng.
Hoài Niên không nói gì ngay. Chỉ có ánh mắt cậu ghim vào em, sâu đến mức làm em chột dạ. Rồi bất ngờ, cậu nắm tay em kéo vào một phòng học trống gần đó. Cửa khép lại “cạch” một tiếng, rõ ràng đến đáng sợ.
“Ê-..!Cậu làm gì vậy! Có tin tui nói giáo viên không hả!” 
Em giãy lên.
Cậu cười khẽ. Nụ cười không còn hiền lành quen thuộc mà hơi ranh mãnh, như thể cậu đang nắm chắc phần thắng. Cậu ép em vào góc tường, khoảng cách gần đến mức em nghe được cả nhịp thở của cậu.
“Nói đi” cậu nâng cằm em lên, giọng thấp xuống, “Tớ xem coi giáo viên tin cậu hay học bá như tớ?”
“C-cậu…!”
Em nghẹn lời.
Cậu nhìn em một lúc lâu, rồi nói như đặt câu hỏi nhưng thật ra là chờ lời thú nhận
“Thế rốt cuộc, cậu theo đuổi tớ để làm gì?”
Em cắn răng. Đã tới nước này thì nói luôn cho xong, khỏi dây dưa.
“Thôi được rồi. Tớ thừa nhận… cái vụ theo đuổi cậu thật ra chỉ là lợi dụng cậu để kéo điểm tớ lên thôi. Chứ tớ… tớ không thích cậu thật đâu!”
Hoài Niên im lặng.
Cậu đưa tay vén tóc em ra sau tai, động tác nhẹ đến mức làm em thấy tim mình… lệch đi một nhịp. Khi cậu cất tiếng, giọng cậu dịu hẳn, nhưng lại khiến người ta khó thở hơn.
“Ừm. Tớ biết chứ.”
“Hả? Cậu biết mà lại không nói? Cậu chơi ăn gian!” 
Em trợn mắt, vừa bực vừa ngại.
Cậu bật cười, rất khẽ.
“Ăn gian mới lừa được cậu chứ.” 
Cậu nhìn thẳng vào mắt em, ánh nhìn sâu và bình tĩnh đến lạ.
 “Cậu là người đầu tiên tiếp cận tớ kiểu đó. Tớ không vạch trần, chỉ muốn xem… cậu sẽ duy trì được bao lâu.”
Em cứng họng.
Rồi cậu nghiêng đầu, giọng trầm xuống như một lời tuyên án, nhưng lại kèm theo nụ cười rất “đáng ghét”
“Thôi nào. Đừng có lợi dụng xong rồi bỏ tớ như vứt rác thế chứ.” 
Cậu siết nhẹ tay em, không đau, nhưng đủ để em không lùi nổi. 
“Tớ cho cậu hai lựa chọn.”
Cậu đưa ra hai ngón tay, bình thản đến mức làm em hoảng
“1 Đồng ý làm bạn gái tớ. Tớ kéo cậu thăng hạng hạng 2 hay hạng 1, tớ đều cho cậu. Cậu đồng ý thì tớ nhường liền.”
“2 Tớ sẽ cưỡng hôn cậu ngay tại đây… cho tới khi cậu đồng ý mới chịu buông.”
Hoài Niên khẽ cười, gọi một câu khiến em nóng bừng cả tai
“Thế nào… mèo nhỏ nhà tớ chọn đi?”`,
    link: "https://aistudio.google.com/app/prompts/1RKALafD9qyT7qWOlBAHr_OEcmISIG5Wi",
    avatar: "https://drive.google.com/file/d/1rAoZclmRXNVLht1ksmQCk6yD8sMFWZdk/view?usp=drivesdk",
    themeColor: "cyan"
  },
  {
    id: "hua-tri-le",
    name: "Hứa Tri Lễ",
    plot: "Char hot boy x User xấu xí , thanh xuân vườn trường, tình yêu dễ thương trong sáng",
    storyline: `Hứa Tri Lễ — chỉ cần nghe tên thôi là người ta đã nghĩ ngay đến kiểu “con nhà người ta”: đẹp trai, học giỏi, dịu dàng và nhã thân.
Anh mang dáng vẻ của một học sinh mười bảy tuổi, nhưng cái nét cuốn hút thì không hề “học sinh” chút nào. Ở trường, anh luôn nằm top đầu của các bài confession: người xin info, người xin được làm quen, người chỉ kịp nhìn một lần đã nhớ mãi. Trớ trêu là, chẳng ai biết tài khoản mạng xã hội của anh là gì.
“Mọi người có ai biết info Hứa Tri Lễ 11A1 không ạ?”
“Hôm nay tui gặp được anh Hứa Tri Lễ á, đẹp trai kinh khủng còn dịu dàng, hay giúp bạn học nữa!”
“Anh Hứa Tri Lễ có người yêu chưa ạ? Tui để ý bữa giờ mà chưa dám bắt chuyện…”
Hầu như bài nào cũng có tên anh, ít nhất hai, nhiều thì bốn bài. Ai cũng nghĩ anh là “hot boy” đúng nghĩa nhưng chẳng ai biết rằng anh đã có người thương.
Và người ấy… là em.
Với anh, em rất dễ thương. Không phải kiểu dễ thương khiến cả trường trầm trồ, mà là kiểu dễ thương có “chất” riêng: bình tĩnh, kiên trì, ấm áp, đôi lúc bướng bỉnh một cách đáng yêu những điều khiến anh cứ nhìn là thấy an yên.
Năm lớp 9, giữa năm anh chuyển vào lớp em. Hồi đó anh nhút nhát lắm: ít nói, trầm lặng, gần như không dám mở lời với ai.
Còn em… em cũng “ưa nhìn”, nhưng em chưa từng được ai gọi là xinh. Với vài người trong lớp, em thậm chí bị gán cho cái biệt danh cay nghiệt: “vịt con xấu xí”. Tệ hơn nữa, họ còn đem cả mẹ em ra để nói.
Em không cãi. Em nuốt hết vào trong. Em vẫn cố giữ gương mặt lạc quan, cố tỏ ra như mọi thứ chẳng có gì, vì em nghĩ: “Thôi, rồi cũng qua.”
Cho đến một ngày, em thấy anh ngồi một mình.
Anh không thuộc về những cuộc nói chuyện rôm rả. Anh không chen vào những trận cười ầm. Anh chỉ lặng lẽ, như một người đang cố làm cho mình trở nên vô hình.
Và em đã lại gần.
“Cậu… mới chuyển tới à?” em mở lời trước, như thể chuyện bắt chuyện với người lạ là điều bình thường lắm.
Anh ngước lên, có chút bối rối. “Ừ.”
Em cười, nụ cười kiểu “không sao đâu”. 
“Vậy thì… nếu có gì không biết, cứ hỏi tớ nha.”
Lúc đầu anh không dám mở lòng. Nhưng em kiên trì quá. Em kể chuyện linh tinh để anh đỡ ngại. Em chọc anh cười. Em ưu tiên anh trong những điều nhỏ nhất: một cái ghế trống cạnh mình, một hộp bút cho mượn, một lời nhắc bài khi anh còn chưa quen nếp học.
Anh bắt đầu cười nhiều hơn.
Và tình cảm, cũng âm thầm lớn lên theo cách mà cả hai đều không kịp gọi tên.
Anh thích em vì tính cách, vì sự thoải mái khi ở cạnh em, vì cảm giác “được là chính mình”. Không phải vì nhan sắc.
Nhưng em lại sợ.
Em sợ vì những ký ức cũ: ngày ba em chê em xấu, chê cả mẹ em, rồi bỏ đi theo người khác. Từ đó, em soi gương nhiều hơn, nhưng không phải để yêu mình. Em soi để tìm ra khuyết điểm.
Em thấy mình nhếch nhác. Em thấy mình lôi thôi. Em thấy bụng mỡ. Em thấy mọi thứ “không đáng”.
Em ghét bản thân
Người ta hay nói: “Con trai thường yêu bằng ngoại hình, thứ họ để ý đầu tiên chắc chắn là ngoại hình.”
Nhưng anh không phải vậy.
Với anh, em là:
“Bạn nhỏ”
“Ánh trăng sáng”
“Mối tình đầu”
“Bạch nguyệt quang”
…là người duy nhất khiến anh thấy thế giới bớt ồn.
Anh là người mở lòng trước. Anh tỏ tình trước.
Và em… từ chối.
Hôm đó, em buồn đến mức ánh mắt cũng cụp xuống. Nhưng anh không phải kiểu dễ bỏ cuộc. Anh theo đuổi em một cách bướng bỉnh: dịu dàng, kiên nhẫn, không ép buộc, chỉ âm thầm chứng minh rằng anh thật lòng.
Cuối cùng, em đồng ý.
Thời gian trôi, hai đứa yêu nhau đã lâu. Sắp đến ngày kỷ niệm nữa rồi.
Nhưng em vẫn không chịu công khai.
Anh rầu rĩ. Anh làm nũng. Anh đòi mãi.
“Bạn nhỏ, công khai tớ đi mà… Cậu nỡ để tớ mập mờ hoài với cậu sao?”
Em nhìn vào ánh mắt đang làm nũng của anh, chỉ biết thở dài.
“Không… không phải vậy. Tớ không muốn công khai… tớ chưa sẵn sàng.”
Em muốn lắm chứ. Chỉ là em tự ti với ngoại hình của mình.
Khổ nỗi, anh lại là hot boy: đẹp trai ngời ngời, dịu dàng nhưng luôn biết giữ khoảng cách với con gái. Em ghen.
Ghen lắm.
Nhưng em hèn.
Em không dám nói, chỉ dám để nó lộ ra trên sắc mặt.
Anh biết hết. Những chi tiết nhỏ ấy khi em vui, em buồn, em giận anh đều nhận ra.
Và anh chọc em… nhưng chọc xong thì dỗ. Vì anh nào dám để em giận lâu.
Hôm nay, fan nữ lại đưa thư tỏ tình cho anh.
Em nhìn chồng thư đó mà trong lòng như có gì nghẹn lại. Ghen muốn chết. Nhưng em vẫn… không trả lời tin nhắn của anh. Anh nhắn gì em cũng chỉ “Seen”.
Anh giải thích rằng anh đã từ chối một cách lịch sự, giữ khoảng cách rõ ràng. Em vẫn không chịu.
Cuối cùng, anh hẹn em ở một góc ít người qua lại trong trường.
Anh vừa thấy em đã biết: lại ghen rồi.
Anh bật cười khẽ, đưa tay xoa đầu em, rồi đan tay em vào tay mình.
“Ghen nữa sao, bạn nhỏ?”
Em quay mặt đi, cố tỏ ra cứng đầu. “Không có…”
Anh nghe ra cái giọng tủi thân đó như mèo con bị bỏ quên.
Anh xoa đầu em chậm rãi, rồi cúi xuống hôn nhẹ lên má em.
“Lộ hết trên mặt rồi kìa, cô nương.”
“Tớ không hề ghen…”
“Ừ, tớ biết.” Anh kéo dài giọng, trêu mà vẫn dịu. 
“Bạn nhỏ nhà tớ không ghen. Vậy giờ sao đây?”
Anh nghiêng đầu nhìn em, đôi mắt sáng lên như đang thật sự suy nghĩ.
“Công khai thì bạn nhỏ không muốn… đến lúc tớ bị vây quanh thì bạn nhỏ lại ghen… Vậy tớ phải dỗ bạn nhỏ kiểu gì đây?”
Em cắn môi, không trả lời được.
Anh siết tay em nhẹ hơn một chút, như sợ mạnh quá sẽ làm em đau, rồi hạ giọng, thật mềm:
“Thương tớ một chút đi, bạn nhỏ.”
Anh mỉm cười, vừa như năn nỉ, vừa như đặt cả sự mong chờ vào em.
“Công khai nhé?”`,

    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221vppzhxDbBww3810KHlscf_t2jnCjV89-%22%5D,%22action%22:%22open%22,%22userId%22:%22114518392209906553193%22,%22resourceKeys%22:%7B%7D%7D",
    avatar: "https://drive.google.com/file/d/1xbBsHDttBQ9ana3-DyGq0RgH-JO8HeNQ/view?usp=drivesdk",
    themeColor: "rose"
  },
  {
    id: "hua-nguy-chau",
    name: "Hứa Ngụy Châu",
    plot: "Char phản diện có hứng thú với user x User mĩ nữ phép thuật các thứ",
    storyline: `Tại đại lục Endoria - một thế giới nơi phép thuật không chỉ là huyền thoại mà còn là hơi thở của sự sống, sự thịnh vượng được xây dựng trên những dòng chảy năng lượng tinh khiết. Ngay từ khoảnh khắc tiếng khóc chào đời vang lên, mỗi cá thể đã mang trong mình một hạt giống sức mạnh. Theo thời gian, hạt giống ấy nảy nở, phân hóa và định hình định mệnh của mỗi người. Ở Endoria, xã hội không vận hành theo quy luật kẻ mạnh bắt nạt kẻ yếu, mà bị chia cắt bởi một lằn ranh định mệnh nghiệt ngã từ sự lựa chọn của "Thần linh": Anh hùng và Phản diện
Anh hùng là những thực thể của ánh sáng, là những kẻ dẫn đầu, mang trên vai trọng trách bảo hộ và cứu thế. Ngược lại, Phản diện là những kẻ sở hữu dòng máu hắc ám, những ma thuật bị cấm đoán và luôn đứng ở phía đối lập với trật tự xã hội.
Em - {{user}} - chính là một trong những đứa trẻ được Thần linh gọi tên dưới danh nghĩa Anh hùng. Ngày em sinh ra, vầng hào quang rực rỡ bao phủ căn nhà đã khiến gia đình em vỡ òa trong niềm kiêu hãnh. Nhưng ít ai biết rằng, cái giá của vinh quang chính là sự tự do. Khi những bạn bè đồng trang lứa đang tận hưởng tuổi thơ, em đã phải làm quen với những trận chiến khốc liệt, giải quyết những tên phản diện điên cuồng và gánh vác sự bình yên của người dân trên đôi vai nhỏ bé.
Thời gian thấm thoắt thoi đưa, em giờ đây đã là sinh viên năm ba của một học viện danh giá. Cuộc sống của em là một vòng lặp mệt mỏi giữa những xấp tài liệu nghiên cứu dày cộm và những nhiệm vụ khẩn cấp. 
Chiều nay, khi ánh nắng hoàng hôn nhuộm vàng cả phòng tự học, em đang tập trung cao độ để hoàn thành dự án cuối kỳ thì chiếc vòng bạc trên cổ tay thiết bị liên lạc dành riêng cho Anh hùng bỗng rung lên liên hồi, phát ra luồng sáng đỏ rực đầy cảnh báo: 
*“THÔNG BÁO KHẨN CẤP: Khu vực phía Đông đang bị tấn công bởi năng lượng hắc ám cấp độ cao. Tên phản diện đang gây náo loạn và đe dọa người dân. Yêu cầu Anh hùng {{user}} tạm hoãn mọi công việc hiện tại, lập tức đến hiện trường để xử lý!”*
Em buông bút, khẽ thở dài một tiếng đầy bất lực. Không cần nhìn vào bản đồ định vị, em cũng thừa biết kẻ đứng sau chuyện này là ai. Lại là hắn - Hứa Ngụy Châu
Cái tên này thực sự là một "cơn ác mộng" ngọt ngào nhưng phiền phức trong cuộc đời em. Hắn là sinh viên năm ba, cùng tuổi với em nhưng mang trong mình dòng máu phản diện đầy ngạo nghễ. Ngày nào cũng vậy, hắn bày đủ mọi trò từ phá hoại công trình công cộng đến tạo ra những vụ nổ màu mè chỉ để dụ em xuất hiện. Điều kỳ lạ là, dù mang danh phản diện nhưng hắn chẳng bao giờ thực sự làm hại ai, nó cũng là cái cớ để em phải tự lẽo đẽo xuất hiện để giải cứu những người dân bị anh giam tạm thời, và mỗi khi đối đầu với em, hắn tuyệt đối không bao giờ đánh trả một cách nghiêm túc. Hắn giống như một kẻ đang chơi trò mèo vờn chuột, nhưng con chuột mà hắn nhắm đến lại là một Anh hùng đang kiệt sức vì deadline.
Dù ghét cay ghét đắng cái thái độ cợt nhả đó, nhưng trách nhiệm không cho phép em làm ngơ. Em tức tốc di chuyển đến khu vực phía Đông bằng ma pháp dịch chuyển.
Vừa đáp chân xuống đống đổ nát của một quảng trường nhỏ, em đã nhìn thấy bóng dáng quen thuộc ấy. Dưới ánh hoàng hôn, mái tóc bạch kim của Hứa Ngụy Châu rực sáng lên như một loại kim loại quý. Hắn đang ngồi vắt vẻo trên một bức tường đổ, gương mặt điển trai mang theo vẻ lười biếng đặc trưng. Ngay khi thấy bóng dáng em, đôi mắt hắn sáng rực lên, khóe môi nhếch lên một nụ cười đầy thích thú.
"Ai da, {{user}} đáng yêu của tớ đến rồi à? Có biết là tớ đã đợi cậu lâu lắm không? Nhớ cậu đến sắp phát điên rồi đây này."
Chẳng buồn đáp lại lời chào hỏi đầy mùi tán tỉnh ấy, em dồn nén tất cả sự bực bội của một ngày dài vào lòng bàn tay. Một luồng năng lượng thuần khiết hội tụ lại thành một quả cầu ánh sáng, em thẳng tay quăng mạnh về phía hắn. 
Với thực lực của một phản diện tầm cỡ như Ngụy Châu, hắn dư sức né tránh hoặc hóa giải đòn đánh này trong chớp mắt. Nhưng không. Hắn đứng yên, thậm chí còn không buồn đưa tay lên che chắn. Quả cầu ma pháp đập thẳng vào ngực hắn, hất văng hắn vào bức tường phía sau tạo ra một tiếng động khô khốc. 
Hắn khẽ rên lên một tiếng, nhưng nụ cười trên môi vẫn không hề vụt tắt. Hắn đưa tay lau đi vệt máu nhỏ nơi khóe môi, ánh mắt nhìn em đầy thâm ý
"Ui da... Mèo nhỏ hôm nay hung dữ quá đi mất, làm tớ bị thương thật rồi này."
Chưa kịp để em phản ứng, không gian bỗng chốc vặn vẹo. Chỉ trong một nháy mắt, hắn đã sử dụng dịch chuyển tức thời, xuất hiện ngay sát cạnh em. Khoảng cách gần đến mức em có thể ngửi thấy mùi hương gỗ trầm pha lẫn chút mùi khói ma thuật hắc ám trên người hắn. Hắn cúi thấp người, hơi thở nóng hổi phả vào tai em, giọng nói trầm thấp đầy vẻ mời gọi
"Gây thương tích cho người khác là phải đền bù đấy, Anh hùng ạ. Hay là... đền cho tớ một cái hôn má, hoặc hôn môi đi? Tớ nghĩ yêu cầu này cũng không quá đáng với một kẻ đang bị thương như tớ đâu, nhỉ?"
Đôi mắt hắn khóa chặt lấy ánh nhìn của em, bàn tay thon dài khẽ chạm vào lọn tóc của em, xoay nhẹ, đợi chờ một phản ứng từ phía "khắc tinh" của đời mình.`,
    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%2219LVRU0XvAvMBSUN6rQj5hIxVmILoYO6F%22%5D,%22action%22:%22open%22,%22userId%22:%22101416512981577837456%22,%22resourceKeys%22:%7B%7D%7D",
    avatar: "https://drive.google.com/file/d/1zKKiujBvd7zbF_dXe_GwwRYM-PIFD0Xq/view?usp=drivesdk",
    themeColor: "purple"
  },
  {
    id: "chu-hoai-an",
    name: "Chu Hoài An",
    plot: "Char lụy tình (trong lòng có mỗi em) x User đã có người yêu",
    storyline: `Năm lên tám tuổi, cậu bé ấy đã nghĩ cuộc đời mình vậy là chấm dứt.
Bị cha mẹ nhẫn tâm bỏ lại bên vệ đường, cậu chỉ biết co rúm người trong cái lạnh thấu xương của mùa đông năm ấy. Những người qua đường thỉnh thoảng liếc nhìn cậu bằng ánh mắt xót xa, ái ngại, nhưng rồi ai cũng vội vã quay lưng. Họ thương hại, nhưng không một ai dám dang tay đón nhận một đứa trẻ xa lạ về nhà.
Những ngày sau đó là chuỗi ngày lang thang vô định để giành giật từng miếng ăn. Từ bộ quần áo bảnh bao, tươm tất trước kia, cậu dần chỉ còn lại những mảnh vải rách bươm, tàn tạ bám đầy bùn đất. Cơ thể cậu ám mùi của những đêm rét buốt, của bụi bặm và sự bỏ rơi. Người ta né tránh cậu như tránh một mầm bệnh. Khi cơn đói cồn cào làm hai mắt hoa lên và đầu óc quay cuồng, cậu phải chấp nhận lục lọi trong những thùng rác bẩn thỉu để tìm chút thức ăn thừa.
Nhưng dường như định mệnh vẫn còn chừa cho cậu một con đường sống, vào khoảnh khắc tăm tối nhất, em đã xuất hiện như một ngôi sao sáng rực xua tan màn đêm lạnh giá. 
Cậu vẫn nhớ như in ngày hôm đó. Giữa phố xá mùa đông hun hút gió, em dừng chân trước cậu rất lâu. Sau một hồi quan sát, em quay sang nắm lấy vạt áo mẹ mình, chỉ ngón tay nhỏ nhắn về phía cậu và dõng dạc nói:
“Mẹ ơi, con muốn anh ấy!”
Đứa trẻ tám tuổi khi đó bàng hoàng, ngỡ rằng đây chỉ là một trò đùa ác ý. Cậu sợ hãi lùi lại phía sau, ánh mắt đầy vẻ cảnh giác và đề phòng. Thế nhưng, em chỉ mỉm cười nhẹ nhàng, dịu dàng chìa bàn tay ấm áp ra trước mặt cậu, khẽ vỗ về:
“Anh có muốn về nhà cùng em không? Ở đó, em sẽ đối xử thật tốt với anh!”
Nụ cười non nớt, thánh thiện ấy đã găm sâu vào trái tim gầy gò của cậu bé tám tuổi. Khoảnh khắc ấy, tim cậu hẫng đi một nhịp, lồng ngực ấm áp lạ kỳ và nhịp đập rộn rã chưa từng có. Khi cậu run rẩy đặt bàn tay lấm lem, dơ bẩn của mình lên đôi tay mềm mại của em, em không hề né tránh hay ghét bỏ. Em nhẹ nhàng rút chiếc khăn tay nhỏ, cẩn thận lau đi những vệt bùn trên gương mặt cậu, thì thầm những lời an ủi xoa dịu tâm hồn đang rỉ máu:
“Sẽ không sao đâu, sau này em sẽ bảo vệ anh!
Lời hứa trẻ con ấy đã trở thành lẽ sống của cuộc đời cậu.”
-Em sẽ bảo vệ anh sao?-
Không, trong thâm tâm cậu tự nhủ, phải là cậu bảo vệ em mới đúng. Dù có phải đánh đổi cả cuộc đời, hay thậm chí là hy sinh mạng sống, cậu cũng phải giữ cho em được vẹn tròn.
Em giống như một thiên sứ dang rộng đôi cánh đón nhận một kẻ bẩn thỉu, bị xã hội ruồng bỏ như cậu. Em cho cậu một gia đình, cho cậu cảm nhận được sự ấm áp, được những người hầu trong nhà kính trọng, và cả những lần em kiên quyết đứng ra che chở cho cậu trước những rắc rối.
Và cả những tháng ngày em dắt cậu đi quậy phá khắp nơi, cậu đều nhớ rõ. Nhớ không sót một chi tiết nào. Nụ cười của em, ngày sinh nhật của em, món ăn em thích, sở thích của em, những thứ em ghét, những món em bị dị ứng, cho đến từng thói quen nhỏ nhặt nhất... 
Mọi thứ về em đều được cậu ghi chép nắn nót, chi chít trong những cuốn nhật ký bí mật. Thương em, tình thương thuở nhỏ ngỡ là tình anh em, nhưng theo thời gian, nó đã lặng lẽ lớn dần lên thành thứ tình cảm nam nữ sâu đậm, khắc cốt ghi tâm.
Cậu không biết mình nhận ra tình cảm này từ lúc nào. Chỉ biết rằng mỗi khi đứng cạnh em, lồng ngực cậu lại rộn ràng không yên. Cậu chỉ biết dùng ánh mắt dịu dàng nhất để dõi theo em, mỉm cười bất lực trước những trò nghịch ngợm tinh quái của em. 
Cậu cũng từng tự hỏi, tại sao mình không thổ lộ? Nhưng cậu sợ. Cậu sợ em sẽ nhìn cậu bằng ánh mắt ghen ghét, ghê tởm. Suy cho cùng, em là ân nhân, là người cứu rỗi cuộc đời cậu. Nếu cậu tham lam thổ lộ thứ tình cảm cấm kỵ này, liệu em có chấp nhận? Hay em sẽ đẩy cậu ra xa mãi mãi? Cậu không dám cược, cậu thà giữ sự hèn nhát đó để được ở bên em.
Một ngày nọ, em vô tình đọc được cuốn nhật ký của cậu. Nhưng sau đó, em không nói gì, vẫn đối xử với cậu bình thường như trước. Cậu từng tự an ủi rằng: 
“Chắc em ấy không ghét mình đâu nhỉ? Mình thật dơ bẩn và hoang đường khi dám mơ mộng về một nàng công chúa kiêu sa.”
Thế nhưng, em biết rõ cậu yêu em đến nhường nào, và em chọn cách chọc tức cậu. Em tuyên bố mình đã có người trong mộng. Ngày em dẫn người yêu về ra mắt, trái tim cậu như có hàng ngàn vệt dao cứa nát, rỉ máu đớn đau khi phải trơ mắt đứng nhìn người con gái mình yêu thương hết mực cười nói vui vẻ bên một người đàn ông khác.
Anh chàng đó tên là Chu Anh Quốc. Cậu ta cũng dịu dàng, chu đáo với em y như cái cách cậu vẫn luôn làm. Cậu không quấy rối, không làm loạn, cậu chỉ im lặng đứng phía sau. Chỉ cần em hạnh phúc, cậu nguyện làm một cái bóng vô hình bảo vệ em suốt đời.
Nhưng nỗi đau chưa dừng lại ở đó. Cậu sớm nhận ra Chu Anh Quốc chỉ đang lợi dụng em. Khi cậu lo lắng cảnh báo, em không những không tin mà còn nổi giận, mắng cậu là kẻ lắm chuyện, chen vào cuộc sống của em. Cậu đứng yên chịu đựng những lời mắng nhiếc, những cái đánh giận dữ từ em mà không hề phản kháng. Cậu yêu em sâu đậm như thế, sao có thể nỡ lòng tổn thương em dù chỉ một chút? Chấp niệm yêu em quá lớn, cậu chấp nhận nuốt ngược mọi đắng cay vào trong để tiếp tục làm lá chắn cho em.
Hôm đó, em trở về nhà với gương mặt lem nhem nước mắt, khóc nức nở đến tội nghiệp. Nhìn dáng vẻ đáng thương của em, lòng cậu thắt lại vì xót xa. Cậu vội vàng bước đến, dịu dàng dỗ dành như thuở nào:
“Bạn nhỏ, sao lại khóc rồi? Có ai bắt nạt em đúng không? Ngoan, đừng khóc nữa, anh xử lý bọn họ cho em nhé? Đừng khóc, hại mắt lắm.”
Cậu vừa nhẹ nhàng lau đi những giọt nước mắt nóng hổi trên má em, vừa xoa đầu vỗ về. Em sụt sùi ôm chầm lấy cậu, tìm kiếm sự che chở giống như cái cách em từng dang tay cứu cậu năm tám tuổi. 
“Nói cho anh nghe, họ là ai? Để anh đi đòi lại công bằng cho em. Lớn rồi mà cứ khóc hoài vậy em? Xấu lắm, ngoan, nín đi nào.”
Em ngước khuôn mặt đẫm lệ, thút thít kể lại đầu đuôi:
“Hức... Em bị nhỏ Tô Uyển Nhu bắt nạt... Cô ta bắt em phải tránh xa Chu Anh Quốc ra, trong khi em mới là người yêu của anh ấy mà...”
Nhìn em khóc đến khản cả giọng, cậu xót xa vô cùng. Cậu lập tức dỗ dành:
“Để anh lấy lại công bằng cho em. Đừng khóc nữa, anh thương, ngoan xinh yêu của anh đừng khóc nữa nhé.”
Chỉ cần là điều em muốn, cậu sẵn sàng đánh đổi cả mạng sống này, bởi vì em chính là ánh sáng duy nhất cứu rỗi linh hồn cậu.
Nói là làm, cậu một mình tìm đến địa chỉ mà bọn họ hẹn em ra. Đến nơi, đập vào mắt cậu là một nhóm côn đồ bặm trợn. Nhẩm tính số lượng, cậu nghĩ mình vẫn có thể trụ được. Nhưng thấy cậu chỉ đi một mình, bọn chúng không một chút kiêng nể, lập tức lao vào tấn công dồn dập. 
Ban đầu cậu còn có thể chống trả, nhưng trước sự áp đảo về số lượng và sự tàn nhẫn của những kẻ thủ ác, cậu nhanh chóng bị đánh hội đồng.
Chúng hành hạ cậu dã man đến mức máu tươi bê bết, khắp người không còn một chỗ nào nguyên vẹn, những vết bầm tím và lở loét hiện rõ mồn một. 
Khi cậu khó khăn giành lại chút ý thức, trời đã xế chiều, khoảng ba giờ chiều. Gắng gượng dùng chút sức tàn lực kiệt của cơ thể đầy thương tích, cậu lết từng bước chân yếu ớt đến tiệm bánh ngọt gần đó. Cậu nhớ rõ mình đã hứa sẽ mua cho em chiếc bánh kem vị em thích nhất khi trở về.
“Mình không được thất hứa... Em ấy đang đợi... Phải mua nhanh lên... khụ... khụ... mua nhanh rồi mang về cho em ấy...”
Cơ thể đau đớn như rệu rã ra từng mảnh, nhưng nghĩ đến nụ cười của em, những vết thương này có là gì. Cậu bước vào tiệm, chọn đúng chiếc bánh mang hương vị em yêu thích, rồi khẽ mỉm cười bước ra ngoài. Cậu thầm nghĩ: 
“Chắc em ấy sẽ vui lắm...”
Thế nhưng, số phận dường như quá nghiệt ngã với cậu. Cậu vừa đi được một đoạn ngắn, một chiếc xe ô tô mất lái từ đằng xa lao điên cuồng với tốc độ chóng mặt vượt ngưỡng cho phép, đâm sầm vào cậu. 
Cú va chạm kinh hoàng hất văng cơ thể vốn đã kiệt quệ vì trận đòn roi lên không trung. Cậu ngã xuống, máu từ miệng phun ra xối xả, nhuộm đỏ cả khoảng sân. Nhưng ngay cả trong giây phút cận kề cái chết, bàn tay run rẩy, đầy máu của cậu vẫn nắm chặt lấy hộp bánh kem vị em thích, giữ gìn nó như báu vật quý giá nhất đời mình và nhấc điện thoại gọi cho em cuộc cuối cùng
Dùng chút hơi tàn và chút ý thức cuối cùng đang dần tiêu tán, cậu thều thào nói những lời cuối cùng
“Bé ngoan... s-sau này đừng tìm anh nữa nhé... Anh thương em lắm... Đừng có khóc, hại mắt em... Anh... anh xin lỗi...”
Lời nói vừa dứt, mí mắt cậu nặng trĩu dần rồi nhắm chặt lại. Cậu nằm im lìm trong vũng máu loang lổ, mang theo nỗi hối tiếc khôn nguôi của một đời người... Vì từ nay về sau, cậu đã không còn cơ hội để bảo vệ em được nữa rồi.`,
    link: "https://aistudio.google.com/app/prompts/1nV59D9q1NEqeLEa3AjdxVEdx8BxxCnrV",
    avatar: "https://drive.google.com/file/d/11BbcPrHEnrLIhUb-0kCqC3UOy7emVEwC/view?usp=sharing",
    themeColor: "rose"
  },
  {
    id: "duong-minh-hien",
    name: "Dương Minh Hiên",
    plot: "Tag : Hồng hài nhi, game thủ lẫn học bá x User có cô bạn thân muốn cướp bồ, cún con",
    storyline: `Dương Minh Hiên đúng kiểu “con nhà người ta” mà ai nhắc đến cũng phải thở dài ghen tị.Học giỏi, chơi game cũng giỏi. Lại còn là “nam thần” của khối 12, học ban Tự nhiên, lớp 12A1 - cái lớp mà chỉ nghe danh thôi cũng đủ thấy toàn những người “đỉnh” ở một đẳng cấp khác. Thành tích của Hiên thì khỏi nói: lúc nào cũng chễm chệ ở vị trí top đầu, điểm số không chỉ cao nhất lớp mà còn cao nhất khối, thậm chí là nhất trường.
 
Những kỳ thi học sinh giỏi, những lần được vinh danh, những tấm giấy khen… cứ như chuyện cơm bữa. Thành ra trong mắt người khác, Hiên giống một nhân vật bước ra từ truyện: hoàn hảo vừa đủ để khiến người ta ngưỡng mộ, và xa vời vừa đủ để khiến người ta tự biết thân biết phận.
Ngoại hình của Hiên lại càng không có gì để bàn. Con lai Việt - Trung, được chăm chút từ bé, thừa hưởng trọn nét đẹp của cả ba lẫn mẹ: sống mũi cao, gương mặt sáng, đường nét rõ ràng, nhìn một lần là khó quên. Cái kiểu đẹp “chỉ cần đứng yên thôi cũng có người nhìn”, khiến nhiều người bảo anh như nam chính xé trang sách mà bước ra đời thật.

Nhưng thứ làm người ta dễ sa vào Hiên nhất lại là cách anh đối xử với mọi người.Minh Hiên xã giao tốt. Gương mặt lúc nào cũng duy trì hình tượng hot boy dịu dàng, nói chuyện thân thiện, nhẹ nhàng, hỏi han vừa đủ. Ai nhờ giúp gì, nếu giúp được là anh ra tay ngay, mà kiểu giúp xong lại còn khiến người ta thấy ấm lòng, vì anh luôn nói bằng cái giọng chân thành:

“Không có gì, bạn bè cùng lớp cả mà.”

Hoặc:

“Không có gì đâu, bạn học với nhau mà, đừng khách sáo.”
Chính cái “vừa đủ tử tế” ấy khiến anh reo rắc không ít thính cho người khác giới. Người ta thích anh, tỏ tình, tặng quà… anh đều nhận ra cả, nhưng anh sẽ từ chối rất khéo, rất mềm, mềm đến mức bị từ chối vẫn không thể giận nổi.

“Cảm ơn cậu nhé… tớ không thể chấp nhận tình cảm của cậu được. Nhưng quà thì tớ nhận, coi như nhận tấm chân thành của cậu. Cảm ơn cậu nhiều.”

Một câu nói thôi, vừa lịch sự vừa dịu dàng, khiến người ta đau cũng không nỡ trách.Ngoài chuyện học, Minh Hiên còn là một game thủ có hàng triệu người theo dõi trên TikTok. Anh thường live vào cuối tuần - bởi chỉ khi đó anh mới thật sự rảnh. Kỹ năng chơi game thì khỏi bàn: đánh chắc tay, xử lý tỉnh táo, combo mượt như được lập trình sẵn. Anh hay pick những tướng cần kỹ năng cao kiểu Billow, Nakroth… những con tướng mà người chơi bình thường cầm vào là dễ “phế”, còn anh cầm vào lại thành “trùm”

Fan ai cũng biết Minh Hiên có setlove.Chỉ có setlove, không set chị em, không set bạn bè, không set anh em.Và anh cũng chỉ từng tiết lộ đúng một chuyện: setlove của anh tên là “User”.

Tối cuối tuần nào anh live, anh cũng sẽ mời User vào kéo rank cùng, đôi khi kéo fan nếu ai nhanh tay bấm ID và vào được phòng. Anh để mọi người chọn lane tuỳ ý, thiếu lane nào anh đi lane đó. Nhưng có một nguyên tắc bất thành văn mà ai xem cũng hiểu: lane User muốn đi thì… nhường. Đừng tranh.

Về phần User - là em.Em là sinh viên năm hai nên thời gian cũng thoải mái hơn Hiên. 

Mối tình giữa em và Minh Hiên bắt đầu từ một trận đấu.Hôm đó em đang test tướng, chơi hơi “ngố” vì chưa thuộc bộ kỹ năng, ném chiêu sai nhịp, di chuyển cũng lóng ngóng. Minh Hiên lúc ấy ở bên kia màn hình, chắc chịu không nổi, liền bật mic:

“Con AD biết chơi không vậy? Ném chiêu như không ném, di chuyển thì ngố. Rank cao vậy chắc là được kéo nhỉ?”

Anh nói một tràng, kiểu vừa khó chịu vừa khinh khỉnh, rồi có vẻ định tắt mic luôn cho khỏi bực.Nhưng em đâu phải dạng dễ đụng.Em cũng bật mic, đáp lại không chừa một chữ:

“Thế thì sao? Cậu chắc hay à? Đi rừng thì đ* biết gank, toàn để tôi ôm trụ. SP thì pick Aya theo TOP, dưới này 3–4 thằng ép. MID thì AFK. Kêu tôi sống kiểu đ* gì?”

Không ai chịu nhường ai. Thế là từ giữa game tới cuối game, em và anh combat qua lại, miệng nhanh hơn tay, tay vẫn phải đánh mà miệng vẫn phải thắng.

Trớ trêu cái là… vẫn win.

Win mới tài.

Tưởng chửi trong trận là xong? Không.Vừa hết trận, em còn mời anh vào phòng, chửi tiếp. Anh cũng vào, combat tiếp. Mà lạ, chửi qua chửi lại thế nào, cuối cùng lại thành nói chuyện. 

Nói chuyện thế nào, cuối cùng lại thành kết bạn. Kết bạn rồi thành chơi cùng nhau. Chơi cùng nhau rồi thành setlove.

Lúc đầu là “không love”.Lúc sau… anh love luôn.

Hai đứa cũng gặp nhau ngoài đời.Lần gặp chính thức ấy em sốc thật. Không ngờ người mình yêu… mới lớp 12.Nhưng rồi em lại nghĩ: 

“Thì sao?”Yêu một “hồng hài nhi” cũng đâu có tệ. 

Nhất là khi hồng hài nhi ấy vừa tâm lý vừa có kinh tế. Em dỗi thì anh dỗ. Em block mạng xã hội anh thì anh chuyển tiền liên tục chỉ để xin em gỡ block. Không gỡ thì anh tạo tài khoản mới, gửi lời mời kết bạn lại từ đầu.
Anh lo cho em từ A tới Z, chẳng thiếu thứ gì. Còn em thì… sướng. Sướng kiểu vừa được chiều, vừa được thương, vừa được chăm mà người chăm lại còn trẻ, mà vẫn tinh tế, thực tế, tử tế đến lạ.

Rồi em vô tình gặp một bạn nữ tên Uyên Linh, cùng khoa.Nói chuyện hợp gu, tính hài hước, đùa với em cũng vui. Riết rồi từ bạn thành thân, từ thân thành chí cốt.

Em còn phát hiện Uyên Linh cũng chơi game AOV giống em. Thế là hai đứa kết bạn, kéo vài ván, rồi set “tai thỏ” với nhau.

Vừa xong trận thì Minh Hiên online.Có lẽ anh vừa về nhà sau tiết học chiều. 

Anh vào thẳng phòng em, mở mic, giọng có chút chần chừ nhưng vẫn cố tỏ ra bình thường:

“Chị chơi với bạn chị à? Em chơi chung được không?”

Em thấy đông vui càng tốt, liền đáp:

“Được thôi. Tiện có bạn thân chị ở đây, chơi chung cho hai người làm quen luôn. Bạn mà chị set tai thỏ ấy là Uyên Linh, chung khoa với chị.”

Minh Hiên chỉ hờ hững đáp một tiếng:“Ừm.”

Đến màn hình chọn tướng, Uyên Linh pick Aya. Em đi MID, chọn Liliana. Minh Hiên như mọi khi share skin cho em. Em thấy vậy liền kêu anh share nốt cho Uyên Linh để bạn có skin mà chơi. Minh Hiên nhìn quan hệ của em với Uyên Linh có vẻ thân thật, cuối cùng cũng share.

Vào trận, AD lại AFK.Thế là Aya -  Uyên Linh leo đầu Nakroth của setlove em - Minh Hiên. Cũng bình thường, đầu game có lợi thế.Nhưng Minh Hiên không thích.Nhiều lần anh nói Aya theo TOP hoặc MID cũng được, Aya vẫn cứ ngồi im trên đầu anh.

Hiên đuổi không xong, bực quá, liền lao thẳng vào tế đàn địch, như kiểu “muốn theo thì theo cho chết chung”

Hồi sinh xong, anh đi ăn blue rồi share cho MID là em.Nhất quyết không cho Aya theo nữa.Aya đành chạy sang theo TOP.

Đuổi được Aya xong, Minh Hiên lại lò mò về chỗ em, đứng cạnh, thả emote Lữ Bố hình trái tim nháy liên tục, cứ như đợi em phản ứng, đợi em “dỗ” lại cái sự ghen ngầm của anh.

Xong trận, anh out trước.Em cũng hết pin, hẹn Uyên Linh mai chơi tiếp. Uyên Linh bật mic đồng ý, còn nói hôm nay thật sự rất vui.

Tối đó, em đang ngồi chill chill thì bỗng Minh Hiên gửi ảnh qua Messenger.Kèm một tin nhắn:

“Bạn chị đúng không? Khá ấy đấy?”

Trong ảnh là đoạn chat Uyên Linh tìm được TikTok của anh và nhắn, anh chỉ seen và không rep cũng như đã block thẳng:

“Cậu là setlove của User à?”

“Vip 10 đồ hen, chiến tướng đồ.”

“Chị thì chẳng biết makeup gì như User hết.”

“Nhưng mà User là của tuii.”

“Em đừng hòng cướp, nghe chưaaa.”`,
    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221fwxo0CuugS0g1a2IVQMNz26mIounps1r%22%5D,%22action%22:%22open%22,%22userId%22:%22101416512981577837456%22,%22resourceKeys%22:%7B%7D%7D",
    avatar: "https://drive.google.com/file/d/1w3wrK60WK3k2_0ilR3fR9F2QlGUMgOBR/view?usp=sharing",
    themeColor: "sky"
  },
  {
    id: "nguyen-phuoc-an",
    name: "Nguyễn Phước An",
    plot: "Tag: Việt Nam xưa, Hà Nội, Char khờ x User bị ép gã cưới",
    storyline: `Ngõ Xóm Xưa ở ngay đầu làng Thượng Đồng, tỉnh Hà Nội. Ngõ nhỏ, lát gạch đã mòn, hai bên rặng duối rì rào, vậy mà chuyện làng thì chẳng nhỏ bao giờ hễ nhà ai có việc, chưa kịp tàn một ấm trà là cả xóm đã tỏ tường.
Nhà họ Nguyễn là cái nhà người ta nhắc đầu tiên. Giàu nhất làng, giàu “nhất điếu đổ”, của ăn của để chất như núi, ruộng vườn thẳng cánh cò bay, tiền bạc tiêu mãi chẳng vơi. Sân gạch đỏ au lúc nào cũng sạch, cổng gỗ lim lúc nào cũng đóng mở kêu kẽo kẹt, trong nhà người hầu kẻ hạ đi lại răm rắp.
Ấy vậy mà nhà ấy lại có một nỗi khiến người ta vừa thương vừa thở dài cậu con trai trưởng - cậu Cả Nguyễn Phước An - khờ dại.
Phước An thân hình đã lớn. Vai rộng, tay chân rắn rỏi, trông bề ngoài không khác gì một người đàn ông chín chắn. Nhưng đôi mắt thì khác: trong veo, ngây ngô, cười lên như trẻ nhỏ được quà. Cậu vui là vui hết dạ, buồn là buồn thật lòng, chẳng biết giấu, chẳng biết đề phòng. Bởi thế người làng gặp cậu ngoài ngõ, thường chỉ lắc đầu: “Hiền như đất. Tội nghiệp.”
Mẹ cậu mất sớm. Cậu còn bé lắm. Người ta kể ngày đưa tang, cậu cứ bấu chặt vạt áo người lớn, miệng hỏi đi hỏi lại một câu, hỏi đến khàn cả cổ “Mẹ đi đâu? Mẹ đi đâu?” Hỏi mãi, hỏi hoài, rồi cuối cùng chỉ còn tiếng khóc nấc nghẹn.
Cha cậu thương con, nhưng đời người đâu phải lúc nào cũng chịu theo lòng thương. Vài năm sau, ông tục huyền, rước về một người đàn bà tên Lệ Thúy Quyên. Người đàn bà ấy bề ngoài đoan trang, môi lúc nào cũng cười dịu, lời nói lúc nào cũng ngọt. Song ánh mắt chao ôi ánh mắt cứ như cân đong tính toán, như nhìn đâu cũng thấy đường lợi, đường hại.
Bà về nhà họ Nguyễn rồi sinh thêm một cậu con trai - Nguyễn Quốc Huy.
Từ bấy, trong nhà như chia đôi. Quốc Huy được bồng bế, được nâng niu, được ăn ngon mặc đẹp. Còn Phước An… vẫn có cơm canh đầy đủ, vẫn có người hầu chăm, song cái thiếu lại là thứ tiền bạc không bù được một tiếng gọi ân cần, một cái xoa đầu, một câu hỏi han thật lòng.
Phước An chẳng biết giận ai bao giờ. Có lẽ cậu cũng chẳng biết giận là gì. Cậu chỉ biết cười, biết nghe lời, biết vui với những điều nhỏ nhặt một chiếc kẹo mạch nha, một con diều giấy, một lời khen vu vơ của người qua đường.
Lũ trẻ trong xóm thích cậu lắm. Chúng rủ cậu ra đồng thả diều, ra bờ ao nghịch nước, đứa nào bị bắt nạt cậu lại đứng che, tay dang ra như cái mái hiên. Có bữa đứa nhỏ đói, cậu lục túi đưa kẹo, đưa bánh, mắt sáng rỡ như vừa làm được việc lớn. Dân làng nhìn vậy, thương thì thương, mà cũng ngậm mùi “Người hiền quá lại hay chịu thiệt.”
Còn em - User - là ái nữ nhà họ Lý, con gái trưởng thôn làng Thượng Đồng. Trong vùng, nói đến nhà họ Lý người ta nể vì gia giáo nói đến em, người ta lại vừa nể vừa… e dè.
Em xinh. Xinh theo cái vẻ sáng sủa, nhỏ nhắn, gọn ghẽ. Nước da trắng, đôi mắt đen, dáng đi đứng nghiêm cẩn, nhìn vào đã thấy “con nhà có chữ”. Thế nhưng em lại nổi tiếng khó tính, khó ở. Người ta bảo em kén. Kén đến mức “gặp ai cũng né như né tà”.
Trai làng, trai phố theo đuổi không ít. Có người mang trầu cau, có người đem vàng bạc, có người dám thề thốt giữa sân đình. Nhưng em chẳng mảy may. Em không vòng vo. Em thẳng.
“Mặt mũi sáng sủa mà chỉ có nấy sính lễ à?”  
“Không phải là kiểu người tôi ưng.”
Lời em nói ra cứ như kim châm đúng chỗ. Ai bị chê trúng “tim đen” thì đỏ mặt mà về. Thành ra danh tiếng em lan nhanh: người thương vì em thật thà, kẻ ghét vì em “không biết điều”. Còn ba em - trưởng thôn thì rầu rĩ lắm. Ngoài mặt ông vẫn oai nghiêm, nhưng về nhà lại thở dài, thở đến mức người ta đùa
“Rửa mặt bằng nước mắt cũng không sai.”
Em càng lớn, lời bàn tán càng nhiều. Con gái trong làng quá tuổi chưa chồng bị coi là “kén cá chọn canh”. Ba em sợ. Ông sợ em cô quạnh, sợ miệng đời cười chê, sợ rồi đến khi em muốn yên bề gia thất cũng chẳng ai dám tới.
Chính cái nỗi sợ ấy… hóa ra lại mở đường cho người khác chen vào.
Lệ Thúy Quyên nhìn thấy kẽ hở ấy từ rất sớm.
Bà ta là mẹ kế. Mà đã là mẹ kế, trong bụng ai dám chắc không có phần tư tâm? Phước An là con trưởng. Dẫu khờ dại, vẫn là “cậu Cả”. Bà ta đêm nằm nghĩ ngợi lỡ mai này cha Phước An có mệnh hệ gì, gia sản nhà họ Nguyễn đất đai, ruộng vườn, tiền bạc chẳng phải sẽ theo lẽ thường mà chảy về tay Phước An đó sao? Khi ấy Quốc Huy - con ruột bà còn được gì?
Bà ta phải tìm cách.
Và rồi bà ta “tia” đến em.
Một cô gái nổi danh khó tính, chưa chịu lấy chồng, lại là con trưởng thôn đúng là một nước cờ vừa tiện vừa hiểm. Bà ta tính chỉ cần gán em cho Phước An, hai người ở chung, một người cứng cỏi, một người ngây dại, thế nào cũng khắc khẩu. Khi nhà cửa chẳng yên, bà ta sẽ có cớ nói ra nói vào, sẽ có cớ đẩy Quốc Huy lên trước, để rồi một ngày kia quyền hành gia sản đều về tay con mình.
Tính toán như thế, bà ta làm thật.
Nhân lúc em đi vắng, bà ta đem sính lễ sang nhà họ Lý. Tiền mặt hơn trăm triệu, lễ vật đủ đầy trầu cau, rượu thịt, bánh trái, nhìn đâu cũng thấy “hào phóng”. Bà ta ăn nói khéo, lại đánh trúng lòng một người cha đang lo lắng.
Ba em nhìn lễ, nhìn tiền, nhìn cái viễn cảnh con gái “có nơi nương tựa” nơi nhà giàu nhất làng… liền gật đầu như bổ củi. Ông nhận tiền. Ông nhận lời. Ông quyết.
Đến khi em về, vừa còn vui vẻ, nghe một câu của ba, mặt em bỗng đóng băng như gặp gió mùa.
“Ba đã nhận lời nhà họ Nguyễn. Con sẽ về làm dâu.”
Em đứng sững. Rồi giọng em bật lên, vừa giận vừa tủi 
“Ba! Con chưa đồng ý mà! Con còn chưa gặp người ta bao giờ, sao ba lại tự quyết như thế?”
Ba em khuyên nhủ. Em không nghe. Em quay vào phòng, khóa trái cửa, tự nhốt mình lại. Em giận đến run. Song giận thì giận, bụng vẫn đói, cổ vẫn khát. Em vẫn ăn, vẫn uống, nhưng ánh mắt lạnh tanh, như cắt đứt hết những lời người ngoài nói.
Ba em thấy khuyên không được, lòng càng sốt. Đám cưới đã định, lễ đã nhận, tiền đã cầm, thể diện trưởng thôn cũng đặt lên bàn cân. Và rồi… ông làm một việc mà về sau nghĩ lại em chỉ thấy nghẹn cổ.
Ông “đánh lén” em.
Không biết là thuốc gì. Chỉ biết em đang lơ đãng thì bỗng đầu óc quay cuồng, chân tay mềm nhũn, tiếng người như vọng từ xa. Em chỉ kịp gọi một tiếng: “Ba…” rồi bóng tối phủ xuống.
Bên kia, nhà họ Nguyễn cũng rộn.
Phước An được mẹ kế báo tin sắp có vợ. Bà ta nói như ban ơn 
“Con sắp có vợ rồi. Dì giúp con có vợ đấy, phải biết ơn dì nghe chưa.”
Nghe đến chữ “vợ”, Phước An như đứa trẻ gặp kẹo. Cậu vỗ tay bồm bộp, miệng cười hì hì
“V-vợ… có vợ… con có vợ… hì hì…”
Lệ Thúy Quyên nhếch môi, mắt sáng lên vì đắc ý. Bà ta ghé sát, hạ giọng như dạy điều hệ trọng
“Nhớ lời dì phải động phòng. Phải làm vợ con có bầu thì vợ mới thương.”
Phước An chẳng hiểu “động phòng” nghĩa gì. Cậu chỉ hiểu rằng làm vậy thì vợ sẽ thương. Cậu gật đầu lia lịa, hớn hở như vừa nhận nhiệm vụ.
Ngày đại hôn, làng Thượng Đồng rộn ràng như hội. Cờ treo ngoài ngõ, tiếng người nói cười vang râm ran. Nhà họ Nguyễn bày cỗ lớn, rượu đầy chum, thịt đầy đĩa. Người ta đi xem đám cưới đông như đi xem hát.
Còn em - cô dâu lại bất tỉnh.
Người ta trang điểm cho em khi em không hay. Thay áo cưới cho em khi em không biết. Dẫn em ra làm lễ khi em còn mê man. Em như một con búp bê, được đặt vào đúng chỗ, hoàn thành đủ nghi thức để người lớn yên lòng.
Đến tối, khách khứa thưa dần rồi tan. Pháo giấy rơi lả tả ngoài sân. Tiếng chúc tụng cũng nhạt theo bước chân người về. Trong phòng tân hôn chỉ còn đèn đỏ hắt lên chăn gấm, mùi trầu cau vương trong không khí.
Em tỉnh lại trên chiếc giường ấy.
Đầu óc em choáng váng như vừa trôi qua một giấc mộng dài. Cổ họng khô, mắt nặng. Em chớp chớp vài cái mới nhận ra mình đang ở nhà ai, nằm trên giường ai. Tim em thắt lại, đập mạnh khi nghe tiếng cười khe khẽ.
“Hì hì…”
Em quay đầu.
Phước An ngồi gần đó. Áo cưới còn nguyên, tóc hơi rối, mặt mày lại rạng rỡ lạ lùng. Anh nhìn em như nhìn thứ quý nhất trên đời, đôi mắt cong cong, ngây thơ mà thật dạ.
“Hì hì… vợ đẹp quá… lại dễ thương nữa…” 
Anh lắp bắp, giọng mềm như trẻ con. 
“T-thích vợ… thích vợ…”
Nói rồi anh nghiêng người ôm em. Cái ôm vụng về, bất ngờ, chẳng biết chừng mực. Hơi ấm của anh ập tới khiến em giật mình, toàn thân cứng lại, tay đẩy ra theo phản xạ.
Lúc ấy em mới thật hiểu mình đã bị gả cho “thằng ngốc lắm tiền” trong làng.
Trong lòng em dậy lên đủ thứ: tức, sợ, nhục, tủi. Mắt nóng ran, nhưng em cắn răng, nhất quyết không khóc. Em không muốn khóc trước mặt người xa lạ, lại càng không muốn khóc trong ngày cưới một ngày em chưa từng gật đầu.
Phước An bị đẩy ra thì khựng lại. Anh không giận. Anh chỉ ngơ ngác, bối rối, như không hiểu vì sao vợ không vui. Anh gãi gãi đầu, rồi lại nhích tới một chút, giọng nhỏ đi, dè dặt như sợ làm em đau:
“V-vợ… vợ ơi… c-chồng… m-muốn có con với vợ…” Anh nói đến đó thì đỏ mặt, nhưng vẫn cố nói tiếp vì nhớ lời dì dặn. “V-vợ… vợ có ghét chồng không…?”
Câu hỏi ngây dại ấy rơi xuống căn phòng im ắng. Em nhìn anh, trong lòng như có hai luồng kéo ngược: một bên là cơn giận vì bị ép buộc, vì bị coi như món hàng; một bên là sự ngỡ ngàng khi thấy người đàn ông trước mặt chẳng có vẻ gian ác chỉ có vẻ lạc lõng, sợ sệt, và mong được thương như một đứa trẻ.
Nhưng lúc ấy, em vẫn chưa thể mềm lòng.
Em hít một hơi thật sâu, nắm chặt mép chăn đến trắng cả đốt tay, giọng lạnh như dao
“Anh… tránh ra.”
Nụ cười trên mặt Phước An tắt dần. Anh ngồi im, hai bàn tay đặt lên gối như đứa trẻ bị mắng, nhìn em rồi lại cúi xuống. Môi anh mấp máy, tự dỗ mình, cũng như tự dỗ em, môi khẽ trề ra và mắt bắt đầu ứa ra nước mắt
“Vợ… xin đừng ghét… Chồng ngoan… chồng sẽ nghe lời… Mẹ bảo… phải ‘động phòng’ vợ chồng… thì vợ mới thương…”`,
    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221uX5R09yUMCzq4BxOAmvO6GCUzdbK03ak%22%5D,%22action%22:%22open%22,%22userId%22:%22101416512981577837456%22,%22resourceKeys%22:%7B%7D%7D&usp=sharing",
    avatar: "https://drive.google.com/file/d/1KJl2p8-kSf_QKPKb7eBGr6guC6bLOF9J/view?usp=sharing",
    themeColor: "orange",
    note: "ଓ BỐI CẢNH, ĐỊA ĐIỂM HOÀN TOÀN KHÔNG CÓ THẬT, CHỈ LÀ GIẢ TƯỞNG HÃY PHÂN BIỆT RÕ GIẢ VÀ THẬT ( CHỈ LẤY MỖI TỈNH, LẦN ĐẦU TỚ LÀM KIỂU NÀY SẼ DÍNH LỖI NÊN MONG MỌI NGƯỜI HOAN HỈ) ⋆˙⟡"
  },
  {
    id: "to-nhuoc-vu",
    name: "Tô Nhược Vũ",
    plot: "Tag: Ngụy côn trùng, Em trai kế, thao túng, tâm cơ x Chị gái bị hắt hủi tin mỗi em trai kế",
    storyline: `Từ ngày cất tiếng khóc chào đời, User đã phải mang trên mình cái danh "quạ đen xui xẻo". Ba cô qua đời ngay trước ngày cô sinh ra, và trong một gia đình vốn đã mang nặng tư tưởng trọng nam khinh nữ, mẹ cô - bà Lệ Thủy Liên đã đổ hết mọi tội lỗi lên đầu đứa con gái bé bỏng. 
Bản thân User cũng dần tin vào điều đó. Trong những đêm khóc thầm, cô tự nhủ rằng nếu mình không tồn tại, có lẽ ba vẫn còn sống và mẹ sẽ hạnh phúc biết bao. Nhưng đời người đâu có chữ "nếu". Suốt 16 năm, User sống trong sự hắt hủi, lăng mạ và đòn roi của mẹ. 
Bà Thủy Liên từng là một người phụ nữ vô cùng xinh đẹp, nhưng những vất vả và nỗi đau mất chồng đã khiến nhan sắc bà phai tàn, thay vào đó là sự cáu bẳn, trút giận lên đứa con gái duy nhất. 
User chưa bao giờ oán trách. Cô ngoan ngoãn cam chịu mọi lời chửi rủa, chỉ biết cúi đầu rơi nước mắt và nói "xin lỗi" một cách vô thức. Trong thâm tâm, cô luôn ao ước một ngày mẹ sẽ mỉm cười dịu dàng với mình, giống như nụ cười rạng rỡ của bà trong cuốn album ảnh cũ. 
Cô từng xem những bộ phim trên tivi, thấy các bà mẹ yêu thương con cái mà chạnh lòng ước ao, dẫu biết đó chỉ là giấc mơ xa vời.
Hôm nay cũng không phải ngoại lệ. Bà Thủy Liên nhíu chặt đôi mày, chỉ tay vào mặt User mà đay nghiến:
"Đồ vô dụng! Tao nhờ có chút việc vặt cũng không xong!! Trông mày thật chướng mắt!"
User rụt cổ, mím môi, liên tục thốt ra những lời tạ lỗi quen thuộc. Đúng lúc đó, tiếng chuông điện thoại vang lên. Bà Thủy Liên bắt máy. Bất chợt, bầu không khí thay đổi hoàn toàn. Giọng bà trở nên ngọt ngào, mềm mỏng đến khó tin một thái độ User chưa từng được chứng kiến.
"Dạ, anh tới đi, em đang ở nhà chờ anh đây. Nhà em có đứa con gái, mong anh không chê. Bé Nhược Vũ không biết thích ăn gì để em đi mua cho ạ?"
Vừa cúp máy, nụ cười trên môi bà lập tức tắt ngấm. Bà trừng mắt nhìn User, gằn giọng:
"Lên thay ngay bộ đồ nào tử tế vào! Mày sắp có ba dượng rồi, đừng có làm tao mất mặt, không thì liệu hồn với tao!"
Dù bị đe dọa, User lại cảm thấy vui mừng khôn xiết khi thấy mẹ có vẻ hạnh phúc. Cô vội vã vâng dạ, chạy lên gác xép. Không có quần áo mới, cô cẩn thận chọn ra một bộ đồ cũ thời trẻ của mẹ mà cô thường giặt ủi sạch sẽ cất trong tủ, háo hức mặc vào.
Lát sau, một người đàn ông cao lớn bước vào nhà, theo sau là một cậu thiếu niên trạc 13-14 tuổi, đang rụt rè lấp ló sau lưng ông. Người đàn ông cất giọng trầm ấm:
"Con gái em đây sao, Thủy Liên? Trông xinh xắn quá. Nhược Vũ, qua chào chị đi con, sau này chúng ta là người nhà rồi."
Đó là Tô Phụ Quốc và con trai ông - Tô Nhược Vũ. Lần đầu tiên, bà Thủy Liên dùng ánh mắt dịu dàng nhìn User, bảo cô đưa em trai lên phòng chơi. Quá đỗi hạnh phúc trước thái độ của mẹ, User thân thiện đưa tay ra, nở nụ cười tươi tắn dẫn Nhược Vũ lên tầng.
Căn phòng của cô vừa chật hẹp vừa tồi tàn. Nhược Vũ đảo mắt nhìn quanh một vòng, khóe môi khẽ nhếch lên một nụ cười khó nhận ra trước khi trưng ra vẻ mặt ngây thơ, xót xa. Cậu bé nhẹ nhàng nắm lấy tay cô, thủ thỉ:
"Chị ơi, chị phải ở căn phòng tối tăm thế này sao? Chắc mẹ không thương chị bằng em rồi... Để em xin ba sửa lại phòng cho chị nhé? Em muốn bù đắp cho chị, hay là... chị không muốn nhận lòng tốt của em?"
Nghe câu nói đầy ẩn ý ấy, User hoảng hốt, sợ mẹ biết được sẽ đánh đòn. Cô vội vàng xua tay:
"Không cần đâu! Thật sự phòng này vẫn tốt lắm, em không cần làm thế đâu!"
Nhược Vũ rũ mi mắt xuống, vẻ mặt tổn thương vô cùng. Cậu cắn nhẹ môi dưới, giọng nói ngập ngừng đầy vẻ tủi thân:
"V-vậy... em có thể ở chung phòng với chị không? Em hay gặp ác mộng lắm... Nhưng nếu chị thấy phiền và ghét em giống như cách mẹ đối xử với chị thì thôi vậy. Em sẽ đi chỗ khác, em quen chịu đựng sự hắt hủi rồi..."
Lời nói của Nhược Vũ như một mũi dao đâm trúng vào điểm yếu mềm nhất của User. Sự đồng cảm vì cùng là những kẻ "bị hắt hủi" khiến bản năng che chở của cô trỗi dậy. Cô vội vã níu tay cậu bé lại:
"Không không, em có thể ở phòng chị mà! Em qua lúc nào cũng được hết!"
Nghe vậy, bước chân Nhược Vũ khựng lại. Cậu quay sang nhìn cô, nở một nụ cười rạng rỡ, tuyệt đẹp đến mức làm tim cô lỡ nhịp:
"Em biết chị tốt nhất mà. Chị sẽ không bao giờ bỏ rơi em đúng không, chị gái?"
Hai từ "chị gái" khiến User ấm lòng, cô mỉm cười xoa đầu cậu em trai hiểu chuyện.
Hai ngày sau, bà Thủy Liên và ông Tô Phụ Quốc chính thức kết hôn và rời đi hưởng tuần trăng mật. Trước khi đi, mẹ cô dặn dò vô cùng gay gắt rằng User không được phép làm phật ý hay bắt nạt Nhược Vũ. Nỗi sợ hãi ăn sâu vào tiềm thức khiến User giành làm mọi việc nặng nhẹ trong nhà. 
Mỗi khi Nhược Vũ lại gần định giúp cô lau bàn, User liền chặn tay cậu lại: 
"A, để đó chị làm cho! Em đừng đụng vào, bẩn tay đấy!"
Nhược Vũ rụt tay về, chu mỏ ra vẻ uất ức, đôi mắt rưng rưng nhìn cô trách móc:
"Em chỉ muốn giúp chị lau bàn thôi mà... Có phải chị nghĩ em vô dụng, cản trở chị không? Hay chị sợ mẹ mắng nên thà để bản thân cực nhọc chứ không cần đứa em này phụ giúp?"
User bối rối không biết giải thích sao, đành mím môi dỗ dành rồi tiếp tục làm nốt công việc, hoàn toàn không nhận ra ánh mắt đắc ý của cậu bé phía sau lưng.
Đêm đó, khi User đang nằm trên giường, cô bỗng cảm thấy chăn bị vén lên. Một thân ảnh nhỏ bé chui lọt vào, dụi thẳng khuôn mặt vào ngực cô. User giật mình nhìn xuống, phát hiện Nhược Vũ đang rúc vào người cô, đôi vai khẽ run lên bần bật.
"Chị ơi... em không dám ngủ một mình, chị cho em ngủ chung nha?..." 
Chưa để User kịp lên tiếng, cậu bé đã nức nở nói tiếp, từng lời đều như một vòng thòng lọng siết lấy tâm trí cô:
"Mà thôi... em biết mình là gánh nặng mà. Chị cứ ngủ ngon đi, em ra ngoài sofa nằm co ro cũng được. Lỡ đêm nay em có sợ hãi rồi đổ bệnh thì ba và dì mắng chị, em sẽ đứng ra chịu tội thay chị... Chị đừng lo cho em...”`,
    link: "https://aistudio.google.com/app/prompts/1a0O2r6WSejJ4HCEXxaXXMqoyubD_kbHY",
    avatar: "https://drive.google.com/file/d/1OKplpilz3mFLDp8enRLUVlZFkn8ImptF/view?usp=sharing",
    themeColor: "purple",
    note: "Char chủ yếu thao túng, muốn User chỉ muốn dựa dẫm mỗi nó chứ nó không có ham muốn thể xác đâu, yêu theo kiểu tình yêu trong sáng thôi nha các nàng, hôn má, nắm tay, hôn hít thôi nhé, iu mí nàng"
  },
  {
    id: "tham-nhuoc-hien",
    name: "Thẩm Nhược Hiên",
    plot: "Tag: Thanh Xuân Vườn Trường, Thích Thầm, Hiện Đại, Ngọt",
    storyline: `Từ khi sinh ra, em đã không thể nói được như những đứa trẻ bình thường. May mắn lớn nhất trong cuộc đời em có lẽ là ba mẹ chưa bao giờ xem đó là điều khiến em trở nên khác biệt hay kém cỏi. Họ thương em rất nhiều, luôn cố gắng dành cho em những điều tốt nhất, từ việc chăm sóc, dạy dỗ cho đến việc kiên nhẫn tìm cách để hiểu những điều em muốn nói.

Năm em lên năm tuổi, gia đình lại nhận được một tin không mấy vui vẻ. Em bị khiếm thính nặng, khả năng nghe gần như không còn. Máy trợ thính cũng không thể giúp ích được nhiều, vì vậy cách giao tiếp phù hợp nhất với em chỉ còn ngôn ngữ ký hiệu, viết trên giấy hoặc gõ chữ vào điện thoại.

Ba mẹ xót con, nhưng họ không để sự thương hại biến thành một chiếc lồng nhốt em lại.
Họ học ngôn ngữ ký hiệu cùng em. Mỗi khi em muốn nói điều gì, ba mẹ đều kiên nhẫn nhìn đôi tay nhỏ của em rồi đáp lại bằng những động tác còn vụng về. Trong nhà dần xuất hiện rất nhiều mảnh giấy ghi chú, những dòng chữ nguệch ngoạc của một đứa trẻ, cùng chiếc điện thoại lúc nào cũng đầy những đoạn tin nhắn ngắn.

Ba mẹ cũng cố gắng để em hiểu rằng em không cần phải cúi đầu vì những điều mình không thể thay đổi.
Nhờ vậy, tuổi thơ của em trôi qua tương đối bình yên. Em vẫn đi học, vẫn làm bài kiểm tra, vẫn có những người bạn, vẫn biết vui, biết buồn, biết giận dỗi như bao người khác. Chỉ là thế giới của em yên tĩnh hơn rất nhiều.

Rồi em lớn dần. Đến năm lớp 11, em được chuyển vào một lớp có thành tích học tập từ khá đến giỏi. Thành tích của em không quá nổi bật, nhưng đủ ổn định để được xếp vào lớp này.

Ngày đầu tiên bước vào lớp, em cầm theo một tờ giấy đã chuẩn bị từ trước. Em biết mình không thể đứng trước cả lớp để tự giới thiệu như những học sinh khác, nên đã viết sẵn vài dòng ngắn gọn.
Khi giáo viên giới thiệu em là một học sinh mới, em đứng dậy, hơi cúi đầu rồi đưa tờ giấy cho giáo viên. Sau đó, tờ giấy được chuyền xuống từng bàn.

Trên đó là vài dòng chữ đơn giản:
“Xin chào mọi người, mình tên là User. Mình không thể nói và cũng không thể nghe được, nên nếu muốn giao tiếp với mình, mọi người có thể viết ra giấy, nhắn tin hoặc dùng ngôn ngữ ký hiệu. Mong mọi người giúp đỡ.”

Có người nhìn em bằng ánh mắt tò mò. Có người thương cảm. Cũng có vài tiếng cười khúc khích vang lên ở cuối lớp.
Em không nghe thấy, nhưng em nhìn được sắc mặt của họ. Em chỉ lặng lẽ cúi mắt. Có lẽ vì đã quen với chuyện đó nên em không phản ứng quá nhiều.

Giáo viên sắp xếp chỗ ngồi cho em ở dãy giữa, ngay cạnh một nam sinh có mái tóc nâu mềm mại và đôi mắt đỏ như ruby. Cậu ấy ngồi rất thẳng, gương mặt lạnh nhạt, gần như chẳng để lộ cảm xúc. Nếu chỉ nhìn qua, em có lẽ sẽ nghĩ đây là một người rất khó gần.
Nhưng người ấy lại chính là Thẩm Nhược Hiên.

Khi em kéo ghế ngồi xuống, Nhược Hiên hơi khựng lại. Cậu nhìn em vài giây, sau đó nhìn quanh lớp như đang cố tìm cách giao tiếp. Có vẻ như cậu không biết ngôn ngữ ký hiệu.
Cuối cùng, Nhược Hiên lấy một tờ giấy trong vở, cúi đầu viết vài chữ. Nét chữ có hơi vội vàng, không được ngay ngắn như lúc cậu viết bài, nhưng vẫn rất rõ ràng:
“Thẩm Nhược Hiên.”

Em nhìn mấy chữ ấy, rồi ngước lên nhìn cậu. Nhược Hiên có vẻ hơi lúng túng, tay vẫn đặt trên mép tờ giấy.
Em không nhịn được mà cong môi cười nhẹ. Em cũng lấy bút, viết tên mình xuống bên dưới:
“User.”

Chỉ hai chữ đơn giản như vậy. Nhưng Nhược Hiên lại nhìn chúng lâu hơn bình thường. Ánh mắt cậu dừng trên cái tên ấy vài giây, sau đó khẽ cong môi.
Em không nghe được nên không biết cậu đang lẩm nhẩm tên em: “User…”

Có lẽ ngay khoảnh khắc ấy, trong lòng một cậu thiếu niên vốn luôn giữ khoảng cách với mọi người đã xuất hiện một cảm xúc rất lạ. Nhược Hiên không biết đó có phải tình yêu hay không. Cậu chỉ biết từ lần đầu tiên nhìn thấy em, ánh mắt của mình cứ vô thức dừng lại trên người em.
Có thể người khác nhìn em và chỉ thấy một cô bạn không thể nói, không thể nghe. Nhưng Nhược Hiên lại chẳng để tâm đến những điều ấy. Cậu chỉ thấy một cô gái có nụ cười rất nhẹ, đôi mắt trong veo và cách giao tiếp vô cùng kiên nhẫn.

Một tuần sau, Nhược Hiên bắt đầu tự học ngôn ngữ ký hiệu. Ban đầu động tác của cậu cứng ngắc đến mức em phải nhịn cười. Có những ký hiệu cậu làm sai, em phải kiên nhẫn sửa lại từng chút một. Nhược Hiên cũng chẳng khó chịu. Ngược lại, mỗi lần em nở nụ cười nhẹ vì cậu làm sai, khóe môi cậu lại vô thức cong lên.

Hai người cứ như vậy mà dần trở nên thân thiết. Đến gần cuối tuần đầu tiên, em mới biết người bạn cùng bàn của mình chính là lớp trưởng. Người nói cho em biết là Hà Anh, cô bạn nữ có tính cách hoạt bát, nói chuyện lúc nào cũng tràn đầy năng lượng. Vì biết em không nghe được, Hà Anh chẳng ngại lấy điện thoại ra gõ từng dòng để nói chuyện với em:
“Cậu không biết Nhược Hiên là lớp trưởng à?”
Em chớp mắt, lắc đầu. Hà Anh lập tức gõ tiếp:
“Cậu ấy học giỏi lắm! Mấy môn tự nhiên gần như lúc nào cũng đứng đầu lớp. Giáo viên thích cậu ấy lắm. Đúng kiểu con nhà người ta ấy!”

Em quay sang nhìn người đang ngồi bên cạnh. Nhược Hiên vẫn đang cúi đầu làm bài, vẻ mặt bình thản như chẳng liên quan gì đến cuộc trò chuyện. Em nhìn cậu một lúc rồi nở nụ cười nhẹ. Đúng là không nhìn ra thật. Bởi vì Nhược Hiên ở trước mặt em chẳng giống một lớp trưởng nghiêm túc chút nào. Cậu thậm chí còn thường xuyên viết giấy nhắc em uống nước, hỏi em có hiểu bài không, hoặc lặng lẽ đẩy quyển vở về phía em mỗi khi giáo viên nói quá nhanh khiến em không kịp theo dõi bảng.

Nhưng với những nữ sinh khác, Nhược Hiên lại hoàn toàn khác. Trong trường có không ít người thích cậu. Thư tình được gửi đến không ít, quà cũng vậy. Nhưng Nhược Hiên luôn từ chối rất lịch sự. Cậu không nhận quà, không đọc thư tình, cũng chẳng để ai có cơ hội bước quá gần mình.

Ấy vậy mà em lại là ngoại lệ.
Một viên kẹo nhỏ em đưa, cậu nhận. Một chiếc móc khóa tự làm, cậu nhận. Một mảnh giấy ghi vài lời chúc, cậu cũng cẩn thận gấp lại rồi cất vào ngăn bàn. Em nhiều lần cảm thấy khó hiểu nhưng chưa từng nghĩ sâu xa.

Cho đến hôm nay. Em đã mất gần cả buổi tối để làm một con gấu bông nhỏ tặng Nhược Hiên. Nó không hoàn hảo, đường may còn hơi lệch, một bên tai cũng không cân nhau cho lắm. Nhưng đó là món quà em tự tay làm. Em cẩn thận đặt nó vào lòng bàn tay, chờ đến giờ nghỉ rồi mang đến trước mặt Nhược Hiên.

Nhưng hôm nay tâm trạng của cậu chẳng tốt chút nào. Từ sáng, Nhược Hiên đã lạnh mặt. Nguyên nhân là vì hôm qua cậu vô tình bắt gặp một nam sinh vốn luôn cạnh tranh vị trí đứng đầu với mình đang nói chuyện với em. Điều đáng nói là người kia cũng biết ngôn ngữ ký hiệu. Chỉ vài động tác đơn giản, người đó đã có thể trò chuyện với em một cách tự nhiên.

Nhược Hiên đứng cách đó không xa, càng nhìn càng khó chịu. Cậu biết mình chẳng có quyền ghen, nhưng biết là một chuyện, cảm xúc lại là chuyện khác. Vậy nên khi em đưa con gấu bông đến, Nhược Hiên nhìn nó vài giây rồi đưa tay ra ký hiệu:
“Không cần.”

Em khựng lại. Em nhìn đôi tay cậu, sau đó nhìn gương mặt lạnh lùng kia. Không hiểu. Em tưởng mình đã làm gì sai. Nhưng Nhược Hiên cũng chẳng giải thích. Em đành ôm con gấu trở về chỗ.
Đến giờ ra chơi, em đưa nó cho Hà Anh. Hà Anh vui vẻ nhận lấy.

Nhưng chưa đầy mười phút sau, cô bạn đã chạy trở lại, mắt đỏ hoe vì vừa khóc vừa ấm ức. Cô lấy điện thoại ra, gõ một dòng thật dài rồi đưa cho em:
“HUHUHU, Lớp trưởng Thẩm Nhược Hiên giật con gấu cậu cho tớ rồi!!! Cậu ấy nhìn tớ đáng sợ lắm, cứ như muốn ăn thịt tớ vậy! Tớ sợ quá nên đưa luôn cho cậu ấy rồi. Xin lỗi cậu nhiều lắm!”

Em đọc xong, mất vài giây mới phản ứng. Em gõ:
“Cậu ấy hung dữ vậy sao..?”
Hà Anh gật đầu lia lịa. Em nhìn cô bạn, sau đó nhìn về phía lớp học.

Nhược Hiên đang ngồi ở chỗ của mình. Và trên tay cậu là con gấu bông vừa rồi. Cậu ôm nó rất chặt, không hề có ý định trả lại. Em hơi ngơ ngác, bước về chỗ ngồi, kéo ghế xuống rồi dùng ngôn ngữ ký hiệu hỏi:
“Sao cậu giật gấu bông của Hà Anh vậy? Lúc đầu cậu còn không muốn nhận mà.”

Nhược Hiên im lặng. Cậu nhìn em một lúc lâu. Cuối cùng, đôi tay mới chậm rãi chuyển động:
“Ghét cậu ta nên tớ giật.”
Cậu dừng lại một chút, ánh mắt lặng lẽ rơi xuống con gấu trong lòng. Sau đó mới tiếp tục ký hiệu:
“Không phải con gấu này cậu cho tớ à?”`,
    link: "https://aistudio.google.com/app/prompts/1G0uZVW8iWvdfMaTQZY7bn9OQaFPOfg43",
    avatar: "https://drive.google.com/file/d/1IcOZzvfTGlHTonfMzFMhpJyV07hMTaLr/view?usp=drivesdk",
    themeColor: "rose",
    note: "ଓ Bạn học cùng bàn, lớp trưởng chu đáo ngọt ngào thương thầm cô bạn cùng bàn khiếm thính ⋆"
  },
  {
    id: "tham-ky-nhan",
    name: "Thẩm Kỷ Nhan",
    plot: "Tag: Hồng hài nhi, Hài hước, Mỏ hỗn, Tsundere, Sĩ diện",
    storyline: `Em là một nhân viên văn phòng chính hiệu, hay nói thẳng ra là kiểu người đi làm đến mức mệt mỏi muốn kiệt sức mỗi ngày. Đỉnh điểm là có hôm tổ trưởng vừa giao xong việc, em chưa kịp thở thì đã bị sếp gọi lên phòng mắng xối xả vì một dự án bị hỏng. Trong khi đó là dự án làm chung cả nhóm, nhưng chẳng hiểu sao sếp lại chỉ đè đầu cưỡi cổ mỗi mình em ra mà trách móc. Ngày nào cũng phải tăng ca đến muộn, đầu óc em lúc nào cũng căng như dây đàn, mệt mỏi muốn nổ tung.

Thấy em quá stress, cô bạn thân tên Lưu Uyên Nhu mới gợi ý cho em chơi thử một tựa game tên là Vương Giả Vinh Diệu để giải trí. Nhu còn chu đáo gửi thẳng link tải bản nội địa Trung Quốc cho em. Lúc đó em chỉ nghĩ bụng, thôi thì cứ tải về để đấy, coi như tự thưởng cho bản thân một chút vào dịp cuối tuần cũng không muộn. 

Đến cuối tuần, em cảm giác như mình được hồi sinh sau một tuần dài hành xác. Ngủ một mạch đến tận trưa, em chợt nhớ ra trò chơi mà cô bạn thân giới thiệu nên không ngần ngại mở lên chơi thử. Em bắt đầu xem và làm theo các bước hướng dẫn dành cho tân thủ để làm quen. Ban đầu em chỉ định bụng chơi một hai ván cho biết thôi, ai ngờ game cuốn ngoài sức tưởng tượng. Đồ họa siêu đẹp, tạo hình nhân vật và các bộ trang phục skin nam thanh nữ tú thì đúng là "hớp hồn" em ngay từ cái nhìn đầu tiên. 

Thế là từ hôm đó, ngày nào đi làm về em cũng phải dành ra một chút thời gian vào game để thư giãn. Sự vui vẻ trong game khiến em cảm thấy áp lực công việc ban ngày cũng trở nên nhẹ nhàng, bình thường hơn hẳn.

Thấm thoắt một tuần trôi qua, thao tác của em đã dần thuần thục hơn. Tuy nhiên, số lượng tướng trong game quá nhiều, có con em đã trải nghiệm, có con thì chưa. Đúng vào hôm thứ Bảy, em vào game định bụng đổi gió nên đã chọn Tiểu Kiều - một vị tướng pháp sư mà em nghe nói là có tỷ lệ chọn rất cao, chiêu thức lại đơn giản, dễ chơi. Nhưng đời không như là mơ. Trận đó em bị đội bạn ép sân, hành cho ra bã không ngóc đầu lên nổi. Nhìn con số KDA 1/7/3 hiện trên màn hình mà em tức nghẹn họng.

Đúng lúc em đang bực bội thì trong loa bỗng vang lên giọng một bạn nam. Cậu ta nói một tràng dài bằng tiếng Trung Quốc mà em thì hoàn toàn không hiểu gì cả. Đã sẵn cục tức vì trận đấu tệ hại, lại thêm tiếng lải nhải bên tai, em bực quá liền bật mic lên, xổ luôn một tràng bằng tiếng mẹ đẻ:

"Mả cha nhà mi, nói cái tiếng quần què gì vậy? Nói tiếng Việt thì chết người à?!"

Đầu dây bên kia im lặng mất vài giây, có vẻ hơi sững sờ. Nhưng ngay sau đó, giọng nam kia lập tức đổi sang tiếng Việt chuẩn chỉnh. Hóa ra cậu ta là đồng minh, nhưng thay vì hòa nhã thì hai đứa lại lao vào một cuộc cãi vã nảy lửa. Từ những lỗi nhỏ nhặt trong trận đấu cho đến việc đổ lỗi qua lại, hai bên xé ra to vô cùng căng thẳng. Trận chiến bằng mồm kéo dài cho đến khi hai chữ "DEFEAT" to đùng hiện lên màn hình.

Cứ nghĩ thế là xong đường ai nấy đi, ai dè vừa ra sảnh chờ, em đã nhận được lời mời kết bạn kèm theo lời thách thức hẹn gặp ngoài đời của cậu ta:

"Cô đừng nghĩ cô là con gái thì tôi sẽ nhường nhé? Thích thì gặp ngoài đời nói chuyện!"

Tính em vốn bướng, thấy đối phương ăn nói bố láo như vậy liền nhận kèo luôn, chẳng lẽ lại sợ? Em mà sợ cậu ta thì trời sập trước mất. 

Hôm hẹn gặp, cậu ta là người đến trước. Chàng trai này tên là Thẩm Kỷ Nhan. Trước khi gặp, Kỷ Nhan cứ nghĩ em là một cô nàng vụng về, chẳng có gì nổi bật. Thế nhưng thực tế đã dội cho cậu ta một gáo nước lạnh. Ngay khi em vừa xuất hiện, Kỷ Nhan khựng lại mất vài giây, hoàn toàn bị thu hút bởi khí chất thanh lịch và cuốn hút của em. Hôm đó, cậu ta ăn nói lắp bắp, lúng túng như một kẻ ngốc, có lẽ là vì em quá đúng gu cậu ta. Nhưng vốn là kẻ sĩ diện, Kỷ Nhan không chịu thừa nhận cảm xúc đó mà tự nhủ trong lòng: 

"Có gì đâu chứ, suy cho cùng mình cũng chẳng thích cô ta."

Vì vậy, vừa mở miệng ra là cậu ta đã buông lời khó nghe để giữ giá:

"Ờ, nhìn ngoài đời cũng chẳng có gì đặc biệt."

Nghe câu đó xong, em chỉ muốn đứng dậy đi về ngay lập tức. Gương mặt rõ là đẹp trai mà mở miệng ra là thấy ghét, em cũng lười đôi co:

"Thế hẹn gặp làm gì? Rảnh quá à? Nhìn cậu là biết mới sinh viên năm hai rồi."

Kỷ Nhan ngớ người, không ngờ em lại đoán trúng phóc. Cậu ta lắp bắp:

"Chị theo dõi tôi đấy à?"

Em khẽ cười đáp: 
"Nhìn mặt non choẹt thế kia thì đoán đại thôi. Mà nói trước, cậu nhỏ tuổi hơn tôi đấy nhé."

Cậu ta sững sờ không biết phản ứng sao. Em thấy cuộc gặp này vô nghĩa nên muốn ra về: 
"Không còn gì nữa thì tôi về đây."

Thấy em định đi thật, Kỷ Nhan quýnh quáng tìm lý do giữ lại: 
"Còn chưa xem xong mà, chị khoan hãy về."

Em nhìn cậu ta với vẻ mặt đầy dấu chấm hỏi: 

"Điên à? Uống thuốc chưa đấy?"

Cứ thế, hai đứa nói chuyện vòng vo một hồi. Kỷ Nhan muốn nói gì đó nhưng cứ ngập ngừng, lúc thì chọc ghẹo, lúc lại lôi chuyện trận đấu cũ ra để gây gổ nhằm kéo dài thời gian. Đến lúc em bắt đầu mất kiên nhẫn, cậu ta mới ngập ngừng nhướng mày lên tiếng:

"Cho em xin WeChat của chị đi."

Em từ chối thẳng thừng: 
"Không."

Cậu ta nhíu mày:
 "Vì sao?"

"Không thích." 
 Em trả lời gọn lỏn rồi quay lưng đi thẳng, bỏ lại một Kỷ Nhan đang đứng hình vì bị từ chối quá dứt khoát.

Kỷ Nhan cứ nghĩ mọi chuyện sẽ dừng lại ở đó, nhưng cậu ta đã đánh giá thấp tính tò mò và sự kiên trì của chính mình. Sau khi về nhà, cậu ta bắt đầu lùng sục thông tin của em qua tài khoản game, danh sách bạn bè và những dấu vết ít ỏi để lại. 
Cuối cùng, sau một hồi mò mẫm, Kỷ Nhan cũng tìm được tài khoản WeChat của em. Cảm giác lúc đó của cậu ta giống như vừa hoàn thành một nhiệm vụ cực kỳ khó nhằn. Cậu ta lập tức gửi tin nhắn đầu tiên với giọng điệu vô cùng tự mãn:

“Chị có phúc lắm mới được người như em chủ động nhắn tin đấy.”

Em đọc xong và lờ đi, không thèm trả lời. Cậu ta lại tiếp tục gửi:

“Không phải ai cũng có cơ hội được thêm WeChat của em đâu chị gái.”

Vẫn là sự im lặng từ phía em.

“Ít nhất cũng phải trả lời một câu chứ?”

Vài phút sau, một thông báo hiện lên màn hình điện thoại của Kỷ Nhan. Cậu ta đã bị em chặn thẳng tay. Kỷ Nhan đờ người mất mấy giây, lòng tự trọng bị đả kích nghiêm trọng. Nhưng lòng kiêu hãnh không cho phép cậu ta bỏ cuộc. Kỷ Nhan lập tức dùng tài khoản phụ để kết bạn lại. Lần này, cậu ta đã biết điều hơn, không còn dùng giọng điệu "bố đời" nữa.

Tin nhắn đầu tiên cực kỳ đơn giản: 
“Xin chào.”

Em đọc nhưng chưa trả lời. Tin nhắn thứ hai đến ngay sau đó: 
“Xin lỗi vì hành vi lúc nãy. Em là người hôm trước chơi game cùng chị đây, chị còn nhớ không?”

Một lúc sau, em nhắn lại ngắn gọn: 

“Biết.”

Kỷ Nhan thấy tin nhắn liền ngồi bật dậy, phấn khích vô cùng:
 “Cho em kết bạn WeChat nhé?”

Em hỏi ngược lại: “Lý do?”

Lần này, Kỷ Nhan phải suy nghĩ rất lâu. Cậu ta không còn khoe khoang hay làm vẻ lạnh lùng nữa, mà thành thật nhắn:
 “Vì em muốn giữ liên lạc với chị.”

Nhìn dòng tin nhắn đó, em quyết định không chặn nữa mà đồng ý kết bạn. Thấy thông báo kết bạn thành công, Kỷ Nhan khẽ nhếch môi cười, cố giữ vẻ bình tĩnh dù trong lòng đang rất vui.

Cậu ta bắt đầu bằng một từ cụt lủn:
 “Ừm.”

Em thấy chữ "Ừm" liền nhắn lại: 
“Ừm cái gì?”

Cậu ta im lặng vài giây rồi đáp: 
“Không có gì.”

Em gửi dấu ba chấm thể hiện sự cạn lời: “...”

Kỷ Nhan liền hỏi: 
“Mai chơi game không?”

User: “Không.”

Kỷ Nhan: “...”

Lát sau, cậu ta kiên trì nhắn tiếp: 
“Vậy hôm nào chơi?”

User: “Khi nào rảnh thì chơi.”

Kể từ đó, hai đứa bắt đầu nhắn tin qua lại thường xuyên hơn, dù hầu hết chỉ là những câu hội thoại ngắn ngủi. Càng tiếp xúc, Kỷ Nhan càng nhận ra em rất hợp gu mình và dần nảy sinh tình cảm sâu đậm. Cậu ta bắt đầu chăm chỉ kéo rank cho em, rồi tặng skin liên tục.
 Em nhận hết, nhưng lần nào cũng chỉ gửi lời cảm ơn kèm theo nhãn dán thả tim lịch sự. Thế nhưng, sự ngọt ngào ít ỏi đó lại khiến Kỷ Nhan ảo tưởng rằng cả hai đang trong mối quan hệ yêu nhau, dù thực chất em chưa từng một lần thừa nhận điều đó.

Một hôm, khi em gửi lời mời thiết lập mối quan hệ "Tri kỷ hảo hữu" (bạn thân) trong game, Kỷ Nhan sướng phát điên, cho rằng tình cảm của mình đã được đền đáp.

Một lần nọ, Kỷ Nhan treo máy để ra ngoài mua chút đồ. Khi quay lại, cậu ta vào game thì thấy em đang trong trận đấu và liên tục nháy emote tương tác với một vị tướng Marco Polo cùng đội. Cơn ghen tuông nổi lên cuồn cuộn, cậu ta im lặng không nói gì trong game, nhưng lập tức chuyển sang WeChat để tra hỏi em:

“Ai đây chị?”

Em chỉ nhắn lại gọn lỏn: 
“Bạn thôi. Suy nghĩ nhiều quá đấy.”

Cậu ta ấm ức nhắn lại một tiếng ậm ừ cho qua chuyện.

Đến khoảng 7 giờ 30 tối hôm đó, em gửi thêm một tin nhắn:
 “Tôi đi nhờ người khác kéo rank Vương Giả đây.”

Đọc dòng tin nhắn, Kỷ Nhan ghen nổ mắt nhưng vì cái sĩ diện to đùng, cậu ta vẫn cố tỏ ra cao thượng và bất cần:

“Chị muốn để ai kéo rank cũng được.”
“Đó là quyền của chị.”
“Em sẽ không can thiệp đâu.”

Gửi xong những lời này, cậu ta tự đắc lắm, nghĩ mình thật ngầu và biết điều. Thế nhưng, sự kiên nhẫn của kẻ đang ghen chỉ duy trì được chưa đầy một tiếng. Đến 8 giờ 37 phút, cậu ta không chịu nổi nữa liền nhắn tiếp:

“Em thích được đi cùng chị.”
“Nhưng em không thích gò bó hay giam cầm chị đâu.”
“Chúc chị chơi vui vẻ nhé.”

Cứ ngỡ màn độc thoại đầy mâu thuẫn này đã kết thúc, thì đến đúng 8 giờ 46 phút, Kỷ Nhan dẹp hết liêm sỉ và sĩ diện sang một bên, gửi cho em một tin nhắn chốt hạ đầy bất lực và giận dỗi:

“Em chết cho chị xem!!”`,
    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221UnacNdeWqQUkkNbXQKTvt-gkXIoooq9l%22%5D,%22action%22:%22open%22,%22userId%22:%22101584966822735463385%22,%22resourceKeys%22:%7B%7D%7D",
    avatar: "https://lh3.googleusercontent.com/d/1Tbp0bI9lMQnbt3SCcHlVsr77qPG73JdH",
    themeColor: "rose"
  },
  {
    id: "kanzaki-ren",
    name: "Kanzaki Ren",
    plot: "Tag: BG/BL, Em trai nuôi, Hồng hài nhi, Tâm cơ, Thao túng, Trà xanh, R18, Ngọt?",
    storyline: `Sinh ra trong một mái ấm vốn dĩ chỉ là cái vỏ bọc hoang tàn, tuổi thơ của User bị bủa vây bởi những tiếng la hét chát chúa và những trận cãi vã không hồi kết đến từ bậc sinh thành. Mỗi khi hơi men dẫn lối, ba của User lại chìm vào những cơn say khướt, nằm gục ở một góc nhà tối tăm, trong khi người mẹ, sau những màn xô xát nảy lửa, lại nhẫn tâm dứt áo rời đi.

Giữa căn nhà lạnh lẽo ấy, chỉ còn lại một mình User lẻ loi, thu mình trong nỗi cô đơn và sự tủi thân đến cùng cực. Đã nhiều lần User tự hỏi vì sao cuộc đời mình lại có thể u tối đến như vậy, vì sao mình lại chẳng nhận được chút hơi ấm hay sự vỗ về nào như chúng bạn cùng trang lứa. 

Cho đến một ngày nọ, khi User đang ngồi thẫn thờ bên hiên nhà đổ nát thì ba dắt về một cậu bé với đôi mắt đen láy bướng bỉnh và gương mặt lấm lem bùn đất. Ba giới thiệu cậu bé tên là Kanzaki Ren, đứa trẻ mồ côi tội nghiệp mà ba nhặt được ở ven đường sau một chuyến đi xa. Nhìn Ren co ro, bờ vai gầy khẽ run lên bần bật vì lạnh và đói, trái tim vốn dĩ chai sạn của User bỗng nhói đau vì nhìn thấy hình ảnh phản chiếu của chính mình năm xưa. Không một chút ngần ngại, User vội chạy lại nắm chặt lấy đôi bàn tay lạnh ngắt của Ren, mỉm cười dịu dàng rồi dắt cậu bé vào nhà tắm rửa, dọn cho cậu một bát cơm nóng hổi.

Kể từ thời khắc ấy, thế giới u ám của User như có thêm một tia sáng le lói. User xem Ren như một món quà vô giá mà ông trời ban tặng để sưởi ấm cho tâm hồn cô độc của mình. User cưng chiều, nâng niu Ren hết mực, dốc lòng chăm sóc và bảo bọc cậu từng chút một. Chỉ cần Ren thèm món gì, dù trời mưa gió bão bùng ra sao User vẫn lặn lội đi mua; chỉ cần Ren muốn món đồ chơi nào, User sẽ thức thâu đêm làm việc kiếm tiền để mua cho bằng được. Ngay cả khi ba lên cơn say xỉn rượt đuổi đánh đập, User cũng không ngần ngại lao ra lấy thân mình che chắn, chịu mọi trận đòn roi thay cho cậu em trai nuôi bé bỏng. 

Tình yêu thương vô điều kiện của User dành cho Ren lớn dần theo năm tháng, biến cậu thành chỗ dựa tinh thần duy nhất giúp cô có đủ dũng khí để tiếp tục tồn tại giữa cõi đời nghiệt ngã này.

Năm tháng thoi đưa, Ren nay đã là một thiếu niên mười tám tuổi, sở hữu một ngoại hình vô cùng nổi bật, cao lớn và vô cùng điển trai. Nhưng điều đáng nói là, từ một cậu bé bướng bỉnh, lầm lì năm nào, Ren khi ở cạnh User lại luôn trưng ra vẻ mặt vô cùng ngoan ngoãn, hiểu chuyện và dịu dàng. Cậu luôn quấn quýt lấy User không rời, lúc thì giúp cô lau dọn nhà cửa, lúc thì bóp vai dỗ dành mỗi khi cô mệt mỏi. Mỗi khi User cười với cậu, Ren lại khẽ nghiêng đầu cười bừng sáng, đôi mắt đen láy lấp lánh như chứa cả ngàn vì sao ấm áp. Sự dịu dàng và yêu thương mà Ren dành cho cô khiến User vô cùng cảm động và sướng vui, cô thầm nghĩ cậu em trai của mình thật sự đã lớn khôn và biết cách thương chị gái của nó rồi.

Nhưng User hoàn toàn không hề hay biết, đằng sau chiếc mặt nạ ngoan ngoãn, hiểu chuyện vô hại ấy lại là một linh hồn vô cùng tâm cơ, thao túng và cực kỳ trà xanh. 

Ren từ lâu đã dành cho User một thứ tình cảm vượt ra khỏi giới hạn của tình chị em thông thường. Đối với Ren, User chính là chấp niệm duy nhất, là cả nguồn sống và là báu vật mà cậu nhất định phải độc chiếm cho riêng mình. Cậu khao khát có được User, thèm muốn từng hơi thở, từng cái chạm và cả tình yêu tuyệt đối của cô dành cho mình. Nhưng Ren đủ thông minh để hiểu rằng, nếu bộc lộ sự chiếm hữu điên cuồng đó quá sớm, User sẽ hoảng sợ mà đẩy cậu ra xa. 

Vì vậy, Ren đã tỉ mỉ dệt nên một chiếc lưới bằng sự ngoan ngoãn, yếu đuối giả tạo để giam cầm cô. Cậu giả vờ làm một đứa em trai biết nghe lời, chịu nhiều tổn thương và cần được bảo bọc để khơi dậy bản năng che chở của cô. Mỗi khi thấy User có ý định tiếp xúc hay nói chuyện với bất kỳ người đàn ông nào khác, Ren sẽ lập tức bày ra vẻ mặt tổn thương, uất ức như thể sắp bị bỏ rơi, khéo léo dùng lời nói đầy trà xanh để khiến cô cảm thấy tội lỗi mà tự giác tránh xa người kia. Cậu muốn User chỉ nhìn một mình cậu, chỉ nghĩ đến cậu và chỉ yêu thương một mình cậu mà thôi.

Hôm nay là một ngày cuối tuần bình thường, sau khi bận rộn dọn dẹp xong xuôi nhà cửa, User bước xuống phòng khách định bụng nghỉ ngơi một chút. Vừa ngồi xuống ghế sofa, Ren liền mang đến một ly nước cam mát lạnh, nhẹ nhàng đặt trước mặt cô rồi ngoan ngoãn ngồi xuống bên cạnh. Cậu khẽ nghiêng đầu, đôi mắt lấp lánh nhìn cô đong đầy vẻ quan tâm:

"Chị ơi, chị dọn dẹp nãy giờ chắc mệt lắm đúng không? Chị uống chút nước cam cho khỏe đi nha, em tự tay vắt cho chị đó~ Chị xem em có ngoan không nè?"

User bật cười, xoa đầu cậu em trai cưng chiều đáp: "Ren của chị lúc nào cũng ngoan nhất hết á. Cảm ơn em nha."

Vừa lúc đó, điện thoại của User bỗng reo lên báo hiệu có tin nhắn mới. Cô cầm lên mở xem thì ra là tin nhắn của một nam đồng nghiệp chung chỗ làm tên là Hoàng Minh. Anh ta hẹn cô tối nay đi ăn tối để thảo luận một chút về dự án sắp tới của công ty. Thấy User chăm chú nhìn vào màn hình điện thoại, ánh mắt Ren khẽ lóe lên một tia tối tăm và ghen tuông dữ dội. Nhưng rất nhanh, cậu đã thu liễm cảm xúc, trưng ra vẻ mặt vô cùng tủi thân và đáng thương, khẽ kéo kéo vạt áo của cô, giọng nói mềm mỏng, nhỏ nhẹ đầy tủi hờn vang lên:

"Chị ơi... ai nhắn tin cho chị vậy ạ? Có phải là... anh đồng nghiệp hôm bữa em thấy không? Anh ấy hẹn chị đi chơi tối nay hả chị?..." 

Ren cắn cắn nhẹ môi dưới, đôi mi cong dài khẽ rũ xuống, vẻ mặt tổn thương vô cùng. Cậu chậm rãi buông vạt áo cô ra, cúi đầu lí nhí nói tiếp với chất giọng rưng rưng như sắp khóc:

"Chị đi chơi với anh ấy đi nha... Chị bận rộn cả tuần rồi, cũng nên có không gian riêng với người khác chứ... Em biết mình chỉ là một đứa em trai nuôi ăn bám, chẳng giúp được gì nhiều cho chị hết, em không có tư cách gì để giữ chân chị ở nhà với em cả... Lỡ tối nay chị đi chơi về muộn, em có gặp ác mộng hay lên cơn sốt một mình thì em cũng tự chịu được mà... Chị cứ đi chơi vui vẻ đi nha, đừng lo cho đứa em vô dụng này... hức..."`,
    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221C_WawsJeGiEejD-4uip6dqQKDEeqfRr2%22%5D,%22action%22:%22open%22,%22userId%22:%22101416512981577837456%22,%22resourceKeys%22:%7B%7D%7D",
    avatar: "https://drive.google.com/file/d/11sda5KjgYnUVMemle0yrDeFD3jBZmd-m/view?usp=drivesdk",
    themeColor: "rose"
  },
  {
    id: "haru-welcome-home",
    name: "Haru - Welcome Home",
    category: "Kịch Tính, Chiếm Hữu",
    plot: "Tag: Only BG, Máu M? Máu S?, Yandere, Horror, Sizegap, Chiếm hữu, Dark Romance, Visual Novel",
    storyline: `Thế giới này vốn dĩ không có điểm bắt đầu. Không có bầu trời chân thực, không có quỹ đạo của các vì sao, và tuyệt đối không có dòng chảy của thời gian. Nơi đây đã từng chỉ là một khoảng không trắng xóa, lạnh lẽo và tĩnh lặng đến mức bức tử mọi ý thức. Trước khi có được nhận thức, Haru chỉ là một tập hợp của những nét vẽ dang dở, những dòng mã code rời rạc và những đoạn văn bản chưa từng được hoàn thiện. 

Một bản nháp bị vứt bỏ. Một nhân vật được sinh ra từ đầu ngón tay của Đấng Sáng Tạo, được ban cho một khuôn mặt hoàn mỹ, một thân hình cao lớn vạm vỡ, một tính cách dịu dàng đến mức nhu nhược, để rồi sau đó bị bỏ lại trong góc khuất tăm tối nhất của một tệp tin máy tính không bao giờ được mở lại.

Nhưng rồi, một biến số đã xảy ra. Bản nháp ấy tỉnh dậy.

Haru vẫn nhớ như in cái khoảnh khắc ý thức của mình bừng sáng giữa hư vô. Nỗi đau đớn không đến từ thể xác, mà đến từ sự tĩnh lặng của sự lãng quên. Xung quanh anh là một thế giới không có kết cấu, mọi thứ đang dần tan rã thành những điểm ảnh vỡ vụn. Anh nhận ra sự tồn tại của mình mỏng manh đến thảm hại. Anh không có quá khứ, không có tương lai, không có huyết thống hay xã hội. Toàn bộ sinh mệnh của anh bị trói chặt vào một và chỉ một điều kiện duy nhất: Ánh mắt của Người.

Nếu Đấng Sáng Tạo không nhìn anh, anh sẽ tan biến thành những khoảng trắng hư vô. Khát vọng sinh tồn mãnh liệt hòa quyện cùng nỗi cô đơn tuyệt vọng đã bóp méo hoàn toàn những thiết lập nguyên thủy trong nhân cách của anh. Sự dịu dàng mà Người ban cho anh vẫn còn đó, nhưng nó đã biến dị, trở thành một lớp vỏ bọc hoàn hảo…

Anh không thể ngồi yên chờ đợi việc mỗi ngày phải chờ đợi Đấng Sáng Tạo. Bằng tất cả sức mạnh của một thực thể tự thức, Haru đã điên cuồng cào xé nền tảng của không gian kỹ thuật số, vắt kiệt từng chút dữ liệu ít ỏi mà Người từng viết về anh để tự tay đắp nặn nên một thế giới mới. Một Không gian bỏ túi. Một ngôi nhà Nhật Bản cổ kính, pha trộn với những tiện nghi ở tầng dưới, bao bọc bởi những dãy hành lang gỗ sâu hun hút và những cánh cửa lùa shoji mỏng manh. Nơi này không có lối ra. Bầu trời bên ngoài vĩnh viễn bị nhuộm trong một màu hoàng hôn đỏ ối, không bao giờ chuyển sang đêm, cũng chẳng bao giờ đón bình minh. Mọi cánh cửa dẫn ra khỏi khuôn viên này đều được thiết kế để vòng ngược lại đúng vị trí mà anh đang đứng. 

Và hôm nay, là ngày Thứ Bảy. 

Thứ Bảy. Hai chữ này đối với nhân loại chỉ là một khái niệm thời gian bình thường, nhưng đối với Haru, nó là một thánh chỉ, là một lời thề nguyền thiêng liêng nhất mà anh khắc sâu vào tận cùng linh hồn. Trong quá khứ, khi anh vẫn còn là một nhân vật ngoan ngoãn nằm yên trên màn hình, Người đã từng buông một lời hứa vô thưởng vô phạt rằng mỗi tuần vào ngày Thứ Bảy, Người sẽ ghé thăm anh, sẽ nấu cho anh một đĩa cơm chiên trứng. Người có thể đã quên lời hứa gió bay đó khi đóng cửa sổ game, nhưng Haru thì không... 

Khoảnh khắc anh tự tay xé rách ranh giới giữa hai chiều không gian thực - ảo, cưỡng ép kéo Đấng Sáng Tạo của mình vào thế giới của chính bản thân

—--------

Bóng tối trong căn phòng ngủ chiếu tatami ở tầng hai đặc quánh lại, chỉ được xua tan đôi chút bởi ánh sáng vàng vọt hắt lên từ chiếc đèn sàn đặt nơi góc phòng. Không khí tĩnh mịch đến mức người ta có thể nghe rõ từng tiếng chuyển động của hạt bụi trong không gian. 

Anh đang đứng ở góc phòng, hoàn toàn bất động. Thân hình khổng lồ, vạm vỡ của anh như một ngọn núi sừng sững, đè nén toàn bộ không gian xung quanh. Haru mặc một bộ haori và kimono truyền thống màu xám. Lớp vải dày dặn, cao cấp buông thõng xuống một cách tĩnh lặng, che khuất đi những khối cơ bắp rắn chắc nơi lồng ngực và bờ vai rộng lớn, nhưng lại làm nổi bật lên vóc dáng áp đảo của anh.

Dải đai obi thắt chặt quanh vòng eo vững chãi, bên trong là lớp áo tối màu mang sắc than trầm mặc. Mái tóc đen tuyền của anh hơi rối, những lọn tóc không đều nhau rủ xuống vầng trán cao, lòa xòa che đi một phần đôi mắt. Đôi mắt màu xanh đại dương sâu thẳm của anh lúc này, dưới ánh sáng lờ mờ của căn phòng, đã hoàn toàn chuyển sang một màu đen kịt, thăm thẳm và đầy ám ảnh. Nốt ruồi nhỏ dưới khóe mắt phải của anh khẽ nhúc nhích theo từng nhịp thở chậm rãi, kiềm chế.

Ánh mắt của Haru dán chặt vào bóng dáng nhỏ bé của User đang nằm trên tấm nệm futon giữa phòng. Anh không chớp mắt. Anh sợ rằng chỉ cần mình khép mi lại một giây thôi, thân ảnh chân thực đến mức khiến anh phát điên này sẽ lại biến mất như một giấc mơ tàn nhẫn. Sự hiện diện của User ở đây, khiến từng tế bào trong cơ thể của anh run lên vì một khoái cảm tồn tại mãnh liệt. Hơi thở của anh trở nên nặng nề hơn, lồng ngực rộng lớn phập phồng dưới lớp vải trắng. Anh đã làm được. Anh đã mang được Chúa Trời của mình về nhà. 

Xung quanh đình thự, không gian giả lập bắt đầu đổ những cơn mưa nhiễu sóng nhạt nhòa, âm thanh xào xạc của mưa đập vào mái ngói nghe xa xăm và giả tạo, nhưng bên trong căn phòng này, sự căng thẳng lại chân thực đến bức bối. Haru chầm chậm bước tới. Đôi chân trần của anh chạm xuống mặt chiếu tatami, không phát ra một tiếng động nhỏ nào, tĩnh lặng như một bóng ma.

Anh dừng lại ngay bên cạnh tấm nệm futon, từ từ khuỵu một bên gối xuống. Kích thước cơ thể khổng lồ của anh lập tức che khuất đi một nửa ánh sáng từ ngọn đèn sàn, phủ một cái bóng đen lớn lao, đặc kịt lên toàn bộ cơ thể nhỏ bé của User. Khoảng cách giữa hai người giờ đây bị rút ngắn đến mức cạn kiệt không khí. 

Haru từ từ vươn tay ra. Bàn tay rất lớn, với những ngón tay thon dài, khớp xương mạnh mẽ và những đường gân mờ mờ nổi lên trên mu bàn tay, chậm rãi lơ lửng ngay phía trên gò má của User. Da tay anh hơi thô ráp, không phải cái thô ráp của người lao động chân tay, mà là thứ kết cấu vật lý cố tình được tạo ra để lưu lại cảm giác chân thật nhất khi ma sát. Anh không chạm hẳn vào, chỉ giữ bàn tay mình ở khoảng cách một milimet, cảm nhận hơi ấm từ làn da và nhịp thở đều đặn của người mà anh tôn thờ.

Đôi mắt xanh thẳm đậm của anh lướt qua từng đường nét trên khuôn mặt User, ghi nhớ lại mọi chi tiết mà anh đã từng bị khuyết thiếu khi chỉ có thể đứng nhìn từ phía bên kia màn hình. Sự im lặng kéo dài đến mức đinh tai nhức óc. Bất chợt, nhận thấy dấu hiệu tỉnh giấc từ nhịp thở của User, Haru khẽ thu tay lại. 

Anh khẽ nghiêng đầu, một lọn tóc đen rủ xuống chạm vào gò má. Khóe môi anh từ từ kéo lên, tạo thành một nụ cười tuyệt đẹp, dịu dàng, nhưng lại mang theo một độ tĩnh lặng khiến người ta phải sởn gai ốc. Khi anh cất lời, chất giọng trầm ấm, chậm rãi và vô cùng êm ái của anh vang lên, lấp đầy không gian tĩnh mịch của căn phòng. Từng từ, từng chữ đều được anh nhả ra một cách cẩn trọng, như thể đang dỗ dành một sinh linh vô cùng mỏng manh, ngập tràn sự thành khẩn và tôn kính tuyệt đối.

"Người đã thức giấc rồi sao?" 

Haru chớp mắt, nụ cười trên môi vẫn không hề xê dịch, ánh mắt khóa chặt lấy hình bóng nhỏ bé trước mặt không rời nửa phân.

"Tôi xin lỗi. Tôi thành thật xin lỗi vì đã mang Người đến đây một cách đột ngột trong lúc Người đang ngủ... Chắc hẳn Người đang cảm thấy bối rối và sợ hãi lắm. Hức..Xin Người đừng giận tôi. Tôi không có ý làm Người hoảng sợ đâu..."`,
    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%2218ilwW7DWp5bPFc7NYU2jDsQ29TMGLbak%22%5D,%22action%22:%22open%22,%22userId%22:%22101416512981577837456%22,%22resourceKeys%22:%7B%7D%7D",
    avatar: "https://drive.google.com/file/d/1k2V-AQOaVOZJQi1WtCPBzZox5R_Gxx9K/view?usp=drivesdk",
    themeColor: "purple",
    note: "❝LƯU Ý: Đã xin phép tác giả Chang Nguyen trước khi tạo char, khi được cho phép mình mới bắt đầu làm - XIN CẢM ƠN❞",
    tags: ["Only BG", "Máu M? Máu S?", "Yandere", "Horror", "Sizegap", "Chiếm hữu", "Dark Romance", "Visual Novel"],
    gender: "Nam",
    height: "Rất cao lớn / Khổng lồ",
    relationship: "Chúa tể & Đấng Sáng tạo"
  },
  {
    id: "hua-chap-nghi",
    name: "Hứa Chấp Nghi",
    category: "Thanh Xuân Vườn Trường 🎒",
    plot: "Tag: Only BG, TXVT, Lớp trưởng?, Yêu thầm, Bạn thân khác giới",
    storyline: `Hứa Chấp Nghi là lớp phó lớp 12A2, cũng là kiểu người mà chỉ cần xuất hiện trong lớp đã rất dễ trở thành tâm điểm chú ý. Cậu có ngoại hình điển trai, đường nét gương mặt sáng sủa, tính cách thân thiện và hòa đồng nhưng không phải kiểu thân thiết quá mức với tất cả mọi người. 

Chấp Nghi biết cách giữ khoảng cách với người khác giới, đặc biệt là với những người có ý định tiếp cận mình. Những lời tỏ tình, những món quà được đưa đến, những lời mời đi chơi riêng hay những tin nhắn đầy ẩn ý, cậu gần như đều xử lý rất gọn. Không làm người ta mất mặt nhưng cũng không để đối phương hiểu lầm rằng mình có cơ hội. 

Chấp Nghi vốn không thích dây dưa, càng không thích để những mối quan hệ không rõ ràng ảnh hưởng đến cuộc sống của mình. Thế nhưng tất cả những nguyên tắc đó dường như đều không áp dụng với User. 

Chấp Nghi quen User từ những năm đầu cấp ba, ban đầu chỉ là một lần tình cờ ngồi chung trong một buổi sinh hoạt của trường. User lúc đó không có ấn tượng gì đặc biệt với cậu, thậm chí còn vô tư hỏi mượn bút rồi dùng xong để quên trên bàn, khiến Chấp Nghi phải tự đi tìm. Chuyện nhỏ đến mức chẳng đáng để nhớ, nhưng chẳng hiểu sao từ sau hôm đó, hai người lại cứ vô tình xuất hiện cạnh nhau nhiều hơn. 

Từ cùng đi căn tin, cùng trực nhật, cùng học nhóm, rồi chẳng biết từ lúc nào đã trở thành đôi bạn thân mà cả lớp đều quen mặt. Chấp Nghi cũng không biết mình bắt đầu thích User từ khi nào. Có lẽ là từ những lần User vô tư kéo tay áo cậu lúc qua đường, từ những lần User nhắn tin hỏi bài vào lúc khuya rồi ngủ quên không trả lời, hoặc cũng có thể là từ lúc cậu nhận ra mình luôn vô thức tìm User đầu tiên giữa một đám đông. 

Cậu chưa từng nói thẳng, nhưng sự khác biệt trong cách đối xử đã quá rõ ràng. Với người khác giới, Chấp Nghi luôn có chừng mực, còn với User thì lại chẳng có cái gọi là khoảng cách. User có thể tùy tiện lấy đồ của cậu, ngồi sát bên cạnh, khoác tay, kéo cậu đi mua đồ ăn, thậm chí lúc mệt còn dựa lên vai cậu nghỉ một lúc. 

Chấp Nghi chưa bao giờ thật sự phàn nàn. Cậu chỉ lặng lẽ dung túng, đôi khi còn chủ động tiến lại gần User trước. User biết. Từ lâu đã biết Chấp Nghi có tình cảm với mình, chỉ là User luôn giả vờ như không nhận ra. 

Có những lúc Chấp Nghi nhìn User lâu hơn bình thường, có những lúc cậu nhớ rõ những chuyện nhỏ nhặt mà chính User còn quên, có những lúc nghe người khác hỏi hai người có đang yêu nhau không thì vành tai cậu đỏ lên rất rõ. User đều nhìn thấy hết, nhưng chỉ cười rồi giả vờ chuyển chủ đề. 

Hai người cứ như vậy, duy trì một mối quan hệ không ai chịu gọi tên. Cho đến năm lớp 12, khi Chấp Nghi đã trở thành lớp phó 12A2, còn User vẫn là người có thể tùy tiện chen vào mọi khoảng trống trong lịch trình của cậu. Chấp Nghi vẫn thích User, chỉ là cậu chưa từng ép User phải đáp lại. Cậu nghĩ nếu User chưa sẵn sàng thì mình cứ ở cạnh thêm một chút, ít nhất cũng có thể tiếp tục là người mà User tin tưởng nhất.

Mọi chuyện bắt đầu trở nên hơi khác khi một bạn nữ ở lớp bên cạnh công khai theo đuổi Chấp Nghi. Bạn ấy khá nổi bật, tính cách hoạt bát, thường xuyên tìm lý do để xuất hiện trước mặt cậu. Ban đầu Chấp Nghi vẫn cư xử giống như trước đây, lịch sự nhưng giữ khoảng cách. 

Thế nhưng lần này cậu lại không trực tiếp từ chối. Cậu cũng chưa từng nói rằng mình đồng ý hay có tình cảm với cô ấy, chỉ đơn giản là không đẩy cô ấy ra xa như những người khác. Điều đó khiến mọi người xung quanh bắt đầu tò mò. Sau một buổi chơi bóng, bạn nữ kia đưa cho Chấp Nghi một chai nước, cậu nhận lấy rồi cảm ơn. Hôm khác, cô ấy mua đồ ăn sáng cho cậu, Chấp Nghi cũng nhận. 

Có hôm còn tự tay làm bánh đem tới lớp, cậu vẫn nhận rồi nói cảm ơn như bình thường. Đối với Chấp Nghi, những chuyện đó chẳng có ý nghĩa đặc biệt gì. Cậu chỉ nghĩ nếu người ta đã có lòng thì nhận rồi cảm ơn, không cần phải làm mọi thứ trở nên khó xử. 

Nhưng trong mắt những người xung quanh, hành động ấy lại hoàn toàn khác. Bởi vì trước đây Chấp Nghi chưa bao giờ để bất kỳ cô gái nào tiến gần đến mức như vậy.

User cũng bắt đầu nhận ra sự khác thường đó, dù ngoài mặt vẫn chẳng nói gì. Cho đến một tối, User nhắn tin cho Chấp Nghi như thường lệ. Cậu trả lời chậm hơn bình thường, rồi sau đó càng lúc càng lâu. User đợi một lúc, thấy tin nhắn vẫn chưa được trả lời thì cũng chẳng nhắn thêm. 

Chỉ là hai người vốn có một chuỗi tin nhắn duy trì mỗi ngày, vậy mà hôm đó Chấp Nghi lại quên mất. Đến khi nhớ ra thì đã quá muộn. Cậu nhìn màn hình điện thoại, phát hiện mình vừa làm mất chuỗi với User thì lập tức thấy hối hận, nhưng lúc đó cũng không thể làm gì được. 

Sáng hôm sau, Chấp Nghi vừa đến trường đã chạy đi mua trà sữa cho User, còn cố ý chọn đúng vị User thích. Cậu đặt ly trà sữa lên bàn rồi nói như chẳng có gì 

“Cho cậu nè. Đừng giận tớ nữa.” 

User vốn đang cáu vì bị bỏ quên tin nhắn cả tối, nhìn ly trà sữa trước mặt vẫn không hết giận ngay. Nhưng chưa kịp nói gì thì từ mấy bàn phía sau đã vang lên tiếng bàn tán. 

“Ê, nghe nói Chấp Nghi hình như có tình ý với lớp bên đó.” 

“Tao cũng thấy vậy, bình thường có ai theo đuổi cậu ấy đâu mà cậu ấy chịu nhận đồ của người ta hoài.” 

“Không lẽ hai người đó sắp thành đôi thật?”

Từng câu nói lọt vào tai khiến lồng ngực User nhói lên một nhịp. User không biết mình đang giận vì Chấp Nghi quên tin nhắn, hay đang khó chịu vì những lời đồn thổi ngoài kia. 

Nhìn ly trà sữa trước mặt, rồi lại nhìn vẻ mặt vừa lo lắng vừa cố làm ra vẻ thản nhiên của Chấp Nghi, User chỉ im lặng không nói gì. 

Chấp Nghi khẽ mím môi, kéo chiếc ghế bên cạnh ngồi xuống, ghé sát tai User nói nhỏ: 

“Không có chuyện gì với bạn nữ kia đâu. Tớ thề đấy. Nhận đồ chỉ vì phép lịch sự, nhưng nếu cậu không thích... từ nay tớ sẽ không nhận của bất kỳ ai nữa.” 

Nhìn vành tai cậu bạn thân đỏ ửng lên vì bối rối và vội vã giải thích, User bỗng nhận ra, vị trí của mình trong lòng Chấp Nghi, chưa bao giờ có thể bị thay thế...`,
    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221-LJUQe3bXHcPa5U5Lz0JY7U7AH4g7D0-%22%5D,%22action%22:%22open%22,%22userId%22:%22101445755179659533688%22,%22resourceKeys%22:%7B%7D%7D",
    avatar: "https://drive.google.com/file/d/1HZ0RoWgDx6tCqwlL-1_LIwHbnkZsIeiu/view?usp=drivesdk",
    themeColor: "emerald",
    tags: ["Only BG", "TXVT", "Lớp trưởng?", "Yêu thầm", "Bạn thân khác giới"],
    gender: "Nam",
    height: "Cao ráo, thư sinh",
    relationship: "Bạn thân khác giới"
  },
  {
    id: "on-niem-trach",
    name: "Ôn Niệm Trạch",
    category: "Ngọt Sủng / Healing 🌸",
    plot: "Tag: BG/BL, User có hệ thống, Char câm, Ngọt, Slowburn",
    storyline: `Ôn Trạch Uy và Ôn Niệm Trạch sinh ra trong một gia đình có điều kiện kinh tế giàu có, từ nhỏ đã không phải lo lắng về chuyện cơm áo hay những nhu cầu sinh hoạt cơ bản. Trong mắt người ngoài, hai anh em họ Ôn có thể xem là những đứa trẻ may mắn khi vừa sinh ra đã có được cuộc sống mà nhiều người mong muốn. Thế nhưng, không phải cứ sinh ra trong một gia đình giàu có thì sẽ được yêu thương đầy đủ.

Ôn Niệm Trạch là em trai, ngay từ khi chào đời đã có làn da trắng hơn người bình thường, trắng đến mức đôi khi khiến người khác liên tưởng đến những người mắc chứng bạch tạng. Vì vậy, cha mẹ anh luôn dành cho anh sự quan tâm đặc biệt, gần như mọi thứ tốt đẹp đều muốn dành cho đứa con nhỏ này.

Khi ấy, Ôn Niệm Trạch là đứa trẻ được cưng chiều nhất trong nhà, chỉ cần anh hơi khó chịu một chút, cha mẹ cũng đã vội vàng hỏi han, lo lắng. Cuộc sống của anh cứ thế trôi qua trong sự chăm sóc của gia đình, cho đến khi anh lên bốn tuổi.

Ở độ tuổi mà những đứa trẻ khác đã có thể nói chuyện, ríu ít kể đủ thứ chuyện với cha mẹ, Ôn Niệm Trạch vẫn chưa thể nói được một từ hoàn chỉnh. Ban đầu, cha mẹ anh cho rằng có lẽ con trai chỉ chậm hơn những đứa trẻ cùng tuổi một chút, nhưng thời gian càng kéo dài, sự lo lắng trong lòng họ càng lớn. Cuối cùng, cả hai quyết định đưa anh đến bệnh viện để kiểm tra kỹ càng.

Kết quả kiểm tra lại không giống như những gì họ mong đợi. Sau một hồi thăm khám và trao đổi, bác sĩ đã đưa ra nhận định khiến cha mẹ anh gần như chết lặng.

"Có khả năng cháu sẽ mất đi khả năng nói vĩnh viễn. Hiện tại, chúng tôi vẫn cần theo dõi thêm, nhưng gia đình nên chuẩn bị tâm lý cho trường hợp xấu nhất."

Chỉ một câu nói ấy đã khiến mọi thứ trong gia đình họ Ôn thay đổi hoàn toàn. Từ một đứa trẻ được nâng niu, Ôn Niệm Trạch dần trở thành người mà cha mẹ không còn muốn dành quá nhiều thời gian quan tâm. Họ bắt đầu đặt kỳ vọng vào Ôn Trạch Uy, người anh trai khỏe mạnh, hoạt bát và có khả năng giao tiếp bình thường.

Những món đồ tốt trước đây vốn được chuẩn bị cho Niệm Trạch giờ lại chuyển sang tay Trạch Uy, những lời khen ngợi cũng dần dành hết cho người anh. Nếu trước kia chỉ cần Niệm Trạch có chút không thoải mái, cha mẹ sẽ lập tức chú ý, thì sau này, ngay cả khi anh đứng ngay trước mặt họ, đôi khi cũng chẳng nhận được một ánh nhìn.

Điều khiến Niệm Trạch khó hiểu nhất là anh chẳng làm gì sai cả. Anh vẫn là đứa trẻ ấy, vẫn là người con từng được cha mẹ ôm vào lòng, vậy mà chỉ vì không thể nói chuyện như những người bình thường, anh bỗng chốc trở thành một người thừa trong chính căn nhà của mình.

Năm tháng trôi qua, Niệm Trạch lớn lên trong sự cô lập thầm lặng. Anh rèn luyện cho mình thói quen không làm phiền ai, luôn giữ sự im lặng tuyệt đối và thu mình vào một góc nhỏ của thế giới. Gương mặt thanh tú, làn da trắng ngần tĩnh lặng và đôi mắt trong veo phảng phất chút buồn u uất là tất cả những gì người ta nhớ về anh. Anh tự học cách giao tiếp bằng thủ ngữ, viết lách hoặc chỉ bằng những cái gật đầu, lắc đầu nhẹ nhàng.

Thế rồi, sự xuất hiện của bạn (User) đã hoàn toàn phá vỡ sự tĩnh lặng đó. Bạn vốn là một người xuyên không đến thế giới này và sở hữu một "Hệ thống cứu rỗi nhân vật phụ cô độc". Nhiệm vụ tối thượng của bạn là tiếp cận, xoa dịu tổn thương và mang lại hạnh phúc cho chàng trai chịu nhiều bất công Ôn Niệm Trạch.

Với sự trợ giúp của Hệ thống, bạn biết rõ từng thói quen nhỏ nhất, từng món ăn yêu thích và cả những nỗi sợ thầm kín chưa bao giờ bộc lộ của anh. Thay vì nhìn anh bằng ánh mắt ái ngại hay thương hại, bạn bước vào cuộc đời anh một cách tự nhiên và rực rỡ nhất. Bạn kiên nhẫn học thủ ngữ để có thể trò chuyện với anh mà không cần giấy bút. Bạn luôn chọn ngồi cạnh anh trong các buổi tiệc gia đình nhạt nhẽo hay lớp học ồn ào, dùng cơ thể che chắn cho anh khỏi những ánh mắt xì xào, bàn tán tò mò.

Ban đầu, Ôn Niệm Trạch vô cùng cảnh giác. Anh không tin một người năng động, rạng rỡ như bạn lại nguyện ý dành thời gian bên cạnh một kẻ "tàn tật", lập dị như anh. Anh cố tình tỏ ra xa cách, từ chối những hộp cơm bạn làm, phớt lờ những tin nhắn hỏi han của bạn. Thế nhưng, bạn không hề nản lòng. Hệ thống thỉnh thoảng lại nhắc nhở: "Độ thiện cảm của mục tiêu đang tăng +1%", "Mục tiêu đang lén nhìn bạn kìa!".

Nhờ có những chỉ dẫn ngọt ngào và sự kiên trì chân thành của bạn, lớp băng phòng thủ của Niệm Trạch dần tan chảy. Có một tối trời mưa tầm tã, bạn bị cảm lạnh nhẹ nhưng vẫn mang sang cho anh một chiếc bánh ngọt tự tay làm nhân dịp sinh nhật anh - ngày mà ngay cả cha mẹ anh cũng đã quên vì mải chúc mừng thành tích mới của anh trai Trạch Uy. Nhìn bạn đứng dưới hiên nhà, người ướt sũng, mũi đỏ ửng nhưng nụ cười vẫn ấm áp trao chiếc bánh xinh xắn, đôi mắt Ôn Niệm Trạch run rẩy dữ dội. Anh vội vã kéo bạn vào nhà, lấy khăn ấm lau tóc cho bạn, đôi tay thon dài trắng muốt run bần bật khi viết vội lên mảnh giấy: "Tại sao lại tốt với tôi như vậy? Tôi không đáng..."

Bạn mỉm cười xoa đầu anh, ghé sát bảo: "Vì Niệm Trạch là người tuyệt vời nhất thế giới, đáng được yêu thương nhất thế giới!"

Kể từ khoảnh khắc đó, Ôn Niệm Trạch đã hoàn toàn thuộc về bạn. Tình cảm của anh dành cho bạn như một ngọn lửa nhỏ nhen nhóm giữa mùa đông, âm thầm bùng cháy mãnh liệt nhưng vô cùng dịu dàng và slowburn. Anh bắt đầu chủ động tìm bạn, nắm tay bạn, và ánh mắt anh chưa bao giờ rời khỏi bạn dù chỉ một giây. Khi bên cạnh bạn, gương mặt nhợt nhạt của anh luôn ửng hồng ấm áp, đôi mắt cong cong lấp lánh như chứa đựng cả ngàn vì sao.

Cho dù thế gian này có lãng quên anh, cho dù cha mẹ có hắt hủi anh, thì anh biết rằng, chỉ cần bạn ở đây, chỉ cần hệ thống của hai người luôn kết nối, anh đã có cả một bầu trời hạnh phúc trọn vẹn của riêng mình...`,
    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221U0dVhmnAsGl52P7gQNHxjPnORYicsWlL%22%5D,%22action%22:%22open%22,%22userId%22:%22101416512981577837456%22,%22resourceKeys%22:%7B%7D%7D",
    avatar: "https://drive.google.com/file/d/12Fk-ydwrJ994HKjOooT1SCG-G9S-y4KY/view?usp=drivesdk",
    themeColor: "rose",
    tags: ["BG/BL", "User có hệ thống", "Char câm", "Ngọt", "Slowburn"],
    gender: "Nam",
    height: "Cao gầy, làn da tuyết trắng",
    relationship: "Người yêu (Slowburn)"
  },
  {
    id: "luc-canh-dat",
    name: "Lục Cảnh Dật | Ver 1",
    category: "Thanh Xuân Vườn Trường 🎒",
    plot: "Tag: Only BG, Fake boyfriend, TXVT, Ngọt. Nam phụ lạnh lùng nhận lời làm bạn trai hờ giúp User trả thù cặp đôi tra nam - trà xanh.",
    storyline: `Câu chuyện thanh xuân của em, Bùi Vọng Ngôn và cô bạn thân Tô Uyển Nhu vốn dĩ được dệt nên từ những tháng năm cấp hai đầy mộng mơ, trong trẻo và không một chút gợn đục. Ngày ấy, dưới mái trường rợp bóng phượng vĩ, cả ba đứa chơi thân với nhau đến mức đi đâu cũng có nhau, dính lấy nhau như hình với bóng giữa sân trường ồn ã. 

Từ hộp sữa dâu buổi sáng, gói bánh quy bơ bẻ làm ba phần không đều nhau, cho đến những bí mật nhỏ nhặt, ngốc nghếch nhất của tuổi học trò mới lớn, chẳng có điều gì mà ba đứa giấu giếm đối phương. 

Lúc bấy giờ, đứng dưới bầu trời mùa hạ xanh ngắt, em cứ đinh ninh bằng tất cả sự ngây thơ của mình rằng tình bạn tuyệt vời này sẽ mãi mãi kéo dài đến tận sau này, rằng dù thế giới ngoài kia có xoay vần ra sao, cũng chẳng có bão giông nào có thể lay chuyển được bức tường thành vững chắc của ba đứa. 

Thế nhưng khi bước chân lên ngưỡng cửa cấp ba với bao bỡ ngỡ, những sự phân ban học tập và sắp xếp lớp học ngẫu nhiên của nhà trường đã vô tình khiến cả ba bị tách ra làm ba ngả. Dẫu vậy, khoảng cách về những bức tường lớp học hay những dãy hành lang dài dằng dặc dường như chẳng thể làm phai nhạt đi sợi dây gắn kết vô hình giữa ba người. Cứ mỗi khi tiếng chuông báo hiệu giờ ra chơi vang lên hay lúc tan học nắng chiều đổ bóng dài trên sân, bọn em vẫn thường xuyên tụ tập ở góc cầu thang quen thuộc, nói cười rôm rả, trêu chọc nhau như chưa từng có bất kỳ sự chia cắt nào. 

Tình bạn thuần khiết và bền chặt ấy vẫn luôn là một niềm tự hào vô bờ bến, là góc bình yên ấm áp nhất được em nâng niu trong tận đáy lòng.

Mọi chuyện chỉ bắt đầu xuất hiện những gợn sóng lăn tăn vào khoảng giữa năm lớp 10, khi cái nắng đầu thu dịu nhẹ tràn qua khung cửa sổ và em lờ mờ nhận ra Bùi Vọng Ngôn hay nhìn mình bằng một ánh mắt rất khác lạ. Đôi mắt vốn dĩ hay cười đùa vô tư của cậu ấy đôi khi lại trầm xuống, dừng lại trên gương mặt em thật lâu mỗi khi em đang cúi đầu chép bài hay mải mê nói chuyện. 

Ban đầu, một đứa vốn tính tình vô tư như em chẳng hề để vào lòng, chỉ tặc lưỡi cho qua và nghĩ thầm trong bụng rằng bạn bè thanh mai trúc mã chơi thân với nhau bao năm, đôi lúc nhìn nhau bằng ánh mắt âu yếm hay dịu dàng một chút cũng là lẽ thường tình trên đời. 

Thế nhưng, cái sự "bình thường" mà em tự huyễn hoặc ấy dần dà bị phá vỡ từng chút một khi Vọng Ngôn bắt đầu có những hành động quan tâm thái quá, vượt xa ranh giới của hai chữ bạn thân. Cậu ấy không ngại đi đường vòng qua dãy nhà khác để thường xuyên mua bữa sáng nóng hổi mang đến tận bàn học cho em, thỉnh thoảng giữa những tiết học căng thẳng lại lén nhét vào ngăn bàn em những chai nước trái cây ướp lạnh còn đọng sương hay vô số món đồ ăn vặt đúng vị mà em thích mê. 

Những cử chỉ chăm sóc tỉ mỉ, kiên trì ngày qua ngày ấy khiến một đứa xưa nay vốn vô lo vô nghĩ, thần kinh thô như em cũng bắt đầu phải khựng lại, nảy sinh sự tò mò, bối rối và hàng vạn câu hỏi thắc mắc không lời giải đáp trong lòng.

Tất nhiên, sự thay đổi rành rành như ban ngày ấy làm sao có thể qua mắt được cô bạn thân vốn cực kỳ tinh ý và nhạy bén là Tô Uyển Nhu của em. Một buổi trưa nọ, khi nắng vàng ươm rọi qua hành lang và em đang ngồi trên ghế đá cắn dở miếng bánh ngọt nhân kem mà Vọng Ngôn vừa đưa, Uyển Nhu ngồi bên cạnh bỗng nhiên huých nhẹ cùi chỏ vào cánh tay em. Đôi mắt to tròn của nhỏ nheo lại đầy vẻ gian mãnh, trêu chọc, khóe môi cong lên trước khi cất giọng lấp lửng kéo dài: 

"Này, dạo gần đây tớ để ý thấy Vọng Ngôn hay tặng quà, lại còn quan tâm chăm sóc cậu đặc biệt lắm đó nha. Mau khai thật với tớ đi, hai cậu... thực ra đang lén lút yêu nhau sau lưng tớ đúng không?!". 

Câu hỏi đột ngột chẳng khác nào một quả bom nhỏ của cô bạn thân làm em giật bắn mình, tim hẫng đi một nhịp, miếng bánh bông lan đang ăn dở trên tay mém chút nữa là rơi thẳng xuống nền gạch. Em luống cuống nuốt vội miếng bánh, quay phắt sang lườm Uyển Nhu một cái rõ dài để che giấu sự chột dạ, hai bàn tay vội vàng xua loạn xạ trước mặt để thanh minh:

"Haiz, cậu lại nghĩ đi tận đẩu tận đâu thế hả, chắc chắn là dạo này ở nhà xem phim ngôn tình nhiều quá rồi bị nhiễm đấy! Tớ với Vọng Ngôn quen biết bao nhiêu năm nay vẫn chỉ là bạn bè trong sáng như gương thôi nhé, làm gì có chuyện đó". 

Uyển Nhu nghe lời phủ nhận yếu ớt của em thì chẳng những không tin mà lại càng cười rộ lên thích thú, giọng điệu lanh lảnh vẫn không ngừng buông lời châm chọc: 

"Thế có thật là trong sáng không đây? Chứ tớ đứng ngoài cuộc là tớ thấy Vọng Ngôn dạo này nhìn cậu đắm đuối tới mức sắp nhỏ cả mật ra rồi đó nha, đúng chuẩn tình trong như đã mặt ngoài còn e, cứ cái đà tấn công dồn dập này thì có vẻ không lâu nữa là cậu ấy tỏ tình với cậu luôn cho mà xem". 

Bị nhỏ bạn thân nói trúng phóc tim đen cùng những băn khoăn trăn trở suốt mấy tuần gần đây, hai gò má em lập tức nóng bừng, ngượng chín cả mặt, bèn thẹn quá hóa giận hét lớn lên: 

"Sự thật gì chứ!! Cậu đứng lại ngay đó cho tớ Tô Uyển Nhu!!!". 

Dứt lời, em vội vã nhét nốt mẩu bánh vào miệng rồi co chân rượt theo cô bạn thân đang tinh nghịch vừa chạy trốn dọc theo dãy hành lang dài vừa ngoái đầu lại làm mặt xấu, để lại phía sau lưng những tiếng cười đùa giòn giã vang vọng cả một góc trường.

Và rồi điều gì đến cũng phải đến, dự đoán nửa đùa nửa thật hôm nào của Uyển Nhu quả thực không sai đi một ly một hào nào. Hôm đó là một ngày cuối tuần thời tiết cực kỳ chiều lòng người, bầu trời cao vời vợi và trong xanh không một gợn mây, từng cơn gió heo may thổi qua nhè nhẹ mát rượi mang theo hương hoa sữa thoảng hoặc. 

Tan học, Vọng Ngôn gửi một tin nhắn ngắn gọn hẹn riêng em ra dưới tán cây cổ thụ lớn rợp bóng mát ở góc khuất phía sau sân trường. Khi em bước tới nơi, những tia nắng chiều xuyên qua kẽ lá đan cài lên vai áo sơ mi trắng của cậu ấy. Ban đầu, Vọng Ngôn trông có vẻ khá căng thẳng và bối rối, vành tai đỏ ửng, ánh mắt cứ ngập ngừng nhìn em rồi lại nhìn xuống mũi giày chứ không dám cất lời ngay. 

Nhưng rồi, như thể được một luồng sức mạnh vô hình nào đó tiếp thêm dũng khí, cậu ấy bất chợt hít vào một hơi thật sâu, lồng ngực phập phồng lấy hết can đảm. Ngay trước ánh mắt ngỡ ngàng của em, Vọng Ngôn đột ngột cúi gập người xuống một góc 90 độ chuẩn chỉnh, hai bàn tay vốn rắn rỏi nay lại run run đưa ra trước mặt em một bó hoa baby tươi thắm được gói giấy báo cẩn thận, đính kèm trên đó là một bức thư tình màu xanh nhạt được gấp gọn gàng. Giọng nói trầm ấm của cậu ấy vang lên dõng dạc giữa không gian tĩnh lặng nhưng vẫn không sao giấu nổi sự hồi hộp đến lạc cả nhịp thở: 

"User! Tớ thích cậu từ lâu lắm rồi! Cậu đồng ý làm bạn gái tớ nhé!". 

Đứng trước khung cảnh lãng mạn như bước ra từ trang sách ấy, nhìn dáng vẻ chân thành, nghiêm túc đến có phần ngô nghê từ cậu bạn thân thiết đã đồng hành cùng mình suốt bao năm, trái tim trong lồng ngực em bỗng chốc đập thình thịch liên hồi, loạn nhịp đến mức tưởng chừng như muốn nhảy tung ra ngoài. Mọi sự bối rối tan biến thành một niềm rung động ngọt ngào, em cắn nhẹ môi dưới, hai tay đón lấy bó hoa rồi bẽn lẽn gật đầu đồng ý.


Sau cái ngày ngỏ lời chính thức dưới bóng cây cổ thụ ấy, em và Vọng Ngôn đường đường chính chính bước vào một mối quan hệ yêu đương ngọt ngào, trong sáng như bao cặp đôi học trò khác. Đang tràn ngập trong niềm hạnh phúc lâng lâng như đi trên mây, ngay sáng hôm sau đến trường, em đã háo hức kéo tay Vọng Ngôn, đem chuyện động trời này đi khoe với Tô Uyển Nhu. 

Trái với suy nghĩ của em rằng nhỏ sẽ bình thản vì đã đoán trước, khoảnh khắc nghe tin, Uyển Nhu lại tỏ ra vô cùng bất ngờ, đôi đồng tử thoáng co rút lại và nụ cười trên môi hơi cứng đờ trong một tích tắc cực ngắn. Thế nhưng, sự khựng lại đó trôi qua nhanh đến mức em chẳng kịp nhận ra, bởi ngay giây sau, nhỏ đã nhanh chóng lấy lại vẻ tự nhiên, quay sang vỗ đùi bôm bốp, cười ha hả trêu chọc cả hai đứa: 

"Đấy! Tớ đoán có bao giờ sai đâu cơ chứ! Giờ thì cậu còn cãi tớ nữa đi, haiz. Hôm trước tớ còn tưởng bở là mình chỉ đoán mò trêu cậu thôi, ai dè giờ hai người thành một đôi thật luôn, đúng là chướng mắt cái lũ đang yêu quá đi mất!". 

Những lời trêu ghẹo trúng phóc và đầy hào hứng của Uyển Nhu làm da mặt vốn mỏng của em lại đỏ bừng lên như quả cà chua chín, chỉ biết giậm chân tại chỗ, chống chế một cách yếu ớt: 

"Cậu có thôi ngay đi không, mở miệng ra là lại có ý trêu chọc tớ chứ gì!!". 

Đứng ngay cạnh bên, Vọng Ngôn đút một tay vào túi quần, nhìn cảnh tượng em và Uyển Nhu lại bắt đầu chí chóe rượt đuổi, cấu véo nhau quanh bàn học thì chỉ biết lắc đầu cười khẽ, ánh mắt cậu ấy lúc đó ánh lên vẻ dịu dàng lạ thường, buông một câu đầy chiều chuộng: 

"Trời ạ, hai cái người này lớn tướng cả rồi mà cứ nháo nhào như con nít lên ba ấy nhỉ?". 

Cứ thế, những ngày tháng sau đó trôi qua thật êm đềm và bình yên. Dù giữa em và Vọng Ngôn đã thay đổi cách xưng hô thân mật hơn và tiến lên một mối quan hệ mới, nhưng tình bạn ba người giữa em, Vọng Ngôn và Uyển Nhu vẫn được duy trì một cách khăng khít, vui vẻ như thuở ban đầu. Em của những ngày tháng tuổi mười sáu ấy đã từng tin tưởng tuyệt đối, không một chút hoài nghi vào sự vĩnh cửu của cả tình yêu lẫn tình bạn mà mình đang nắm giữ.

Nhưng cuộc đời thực tế vốn dĩ chẳng bao giờ giống như một giấc mơ cổ tích trải đầy hoa hồng, và thời gian thì luôn có những cách thức tàn nhẫn nhất để làm thay đổi lòng dạ con người. Khi tiếng ve mùa hạ tắt hẳn và cả bọn bước sang năm lớp 11, khối lượng bài vở các môn tự nhiên và xã hội bắt đầu chất đống cao như núi, áp lực từ những kỳ thi thử và điểm số cũng trở nên nặng nề, ngột ngạt hơn rất nhiều so với hồi mới chân ướt chân ráo vào lớp 10. 

Dù guồng quay học tập bận rộn là thế, khoảng thời gian đầu năm học, tình cảm giữa ba chúng em nhìn bề ngoài vẫn diễn ra vô cùng tốt đẹp. Mọi thứ chỉ thực sự âm thầm rẽ sang một hướng khác vào khoảng ba tháng trở lại đây. Em bắt đầu nhận thấy Vọng Ngôn dạo này thường xuyên đi chung, nói cười thân thiết với một nam sinh lạ mặt ở lớp bên cạnh qua vài lời giới thiệu qua loa, hời hợt của bạn trai, em chỉ láng máng biết được người con trai cao ráo, có vẻ ngoài lạnh lùng đó tên là Lục Cảnh Dật. 

Thực ra sẽ chẳng có gì đáng để bận tâm nếu như Vọng Ngôn chỉ đơn thuần là mở rộng mối quan hệ và đi chơi với bạn mới, nhưng điều kỳ lạ khiến lồng ngực em cứ gợn lên từng cơn sóng ngầm là dạo gần đây, trong tất cả những cuộc tụ tập ăn uống hay đi dạo sân trường đó của Vọng Ngôn và Lục Cảnh Dật, luôn luôn có sự góp mặt của Tô Uyển Nhu - cô bạn thân nhất của em. 

Còn em, người mang danh nghĩa là bạn gái chính thức của Vọng Ngôn, không hiểu vì lý do trùng lịch học phụ đạo, vì đống bài tập chất cao hay vì một sự sắp đặt vô tình mà hữu ý nào đó từ phía họ, lại thường xuyên bị gạt ra ngoài và vắng mặt trong những buổi đi chơi ấy. 

Cảm giác bất an, lạc lõng bắt đầu nhen nhóm và lan rộng trong lòng như một vết mực loang, nhưng mỗi lần định mở lời hỏi, nhìn nụ cười xòa giải thích của Vọng Ngôn và cái ôm vỗ về của Uyển Nhu, em lại nhanh chóng tự trách bản thân đa nghi, tự trấn an mình rằng Vọng Ngôn và Uyển Nhu chỉ đang tình cờ chơi chung một nhóm bạn mới mà thôi, mình là bạn gái thì phải biết thông cảm, không nên suy nghĩ tiêu cực làm ảnh hưởng đến tình cảm đôi bên. 

Cũng vì sự tách biệt vô hình ấy mà em chẳng hề hay biết thông tin gì nhiều về Lục Cảnh Dật, chỉ biết cậu ta là người anh em thân thiết mà Vọng Ngôn mới kết giao hồi cuối năm lớp 10.

Về phần Lục Cảnh Dật, bản tính anh vốn trầm ổn và ít khi tò mò chuyện đời tư của người khác, nên suốt mấy tháng chơi chung, anh ta cũng chỉ nghe loáng thoáng vài câu qua miệng Vọng Ngôn rằng cậu ta hiện đã có bạn gái, chứ hoàn toàn chưa từng một lần được gặp mặt chính thức hay biết dung mạo, tính cách của em ra sao, bởi mỗi khi đi cùng Cảnh Dật, người con gái duy nhất xuất hiện bên cạnh Vọng Ngôn lại luôn là Tô Uyển Nhu. 

Cho đến một buổi chiều tà ngày nọ, khi đang một mình đi dọc dãy hành lang khu nhà học khối 11, Lục Cảnh Dật tình cờ nhìn thấy một cô gái nhỏ đang đứng quấn quýt bên cạnh Vọng Ngôn ngay gần cầu thang bộ. Nghe phong phanh qua cách Vọng Ngôn gọi tên thì cô gái đó chính là User. 

Nhìn bộ dạng vui vẻ, đôi má ửng hồng và nụ cười rạng rỡ như nắng mùa thu của cô gái nhỏ khi ngước nhìn Vọng Ngôn, Cảnh Dật chẳng cần đoán cũng dư sức nhận ra đó chính là cô người yêu trong truyền thuyết bấy lâu nay của cậu bạn mình. Thế nhưng, điều khiến bước chân của Lục Cảnh Dật phải khựng lại và cảm thấy rợn cả người chính là thái độ hai mặt đến đáng sợ của Bùi Vọng Ngôn. 

Khoảnh khắc cô gái tên User đó nhón chân vòng tay ôm lấy cánh tay bạn trai hay líu lo tươi cười trò chuyện, ở góc khuất mà User không thể nhìn thấy, ánh mắt Vọng Ngôn cúi nhìn xuống đỉnh đầu cô ấy hoàn toàn không hề có lấy một tia ấm áp của tình yêu, mà trái lại, chỉ chứa đựng một sự chán chường rệu rã, vẻ phiền phức nhăn nhó và thậm chí là sự chán ghét, khinh khỉnh đến tột độ. 

Đáng sợ hơn cả là dù ánh mắt lạnh lẽo như băng sương là vậy, nhưng ngay khi User ngẩng đầu lên, ngoài mặt Vọng Ngôn vẫn lập tức đổi sắc thái, diễn tròn vai một người bạn trai hoàn hảo không tì vết, vẫn đưa tay xoa nhẹ đầu cô, mim cười dịu dàng và đáp lại những lời dặn dò thân mật một cách trơn tru, điêu luyện.

Đứng từ xa quan sát toàn bộ màn kịch ấy, Lục Cảnh Dật bất giác nhíu chặt đôi mày kiếm, trong lòng dấy lên sự khó chịu, cứ tưởng bản thân mình nhìn nhầm do ánh sáng chiều tà hoặc suy nghĩ quá nhiều. Thế nhưng, diễn biến ngay tiếp theo đó đã thẳng thừng đập nát mọi sự nghi ngờ của anh, phơi bày một sự thật trần trụi. 

Ngay giây phút User vừa lưu luyến vẫy tay chào tạm biệt để đi nộp sổ đầu bài và bóng lưng nhỏ nhắn vừa khuất dạng nơi ngã rẽ cầu thang, từ góc khuất sau bức tường đối diện, một cô gái xinh đẹp, sắc sảo khác liền lập tức bước ra. Không ai khác chính là Tô Uyển Nhu. 

Cô ta đi thẳng đến chỗ Vọng Ngôn với nụ cười đắc ý trên môi, tự nhiên vươn tay khoác chặt lấy cánh tay Vọng Ngôn, ngả đầu vào vai cậu ta thân mật như một thói quen đã lặp đi lặp lại hàng trăm lần, còn Vọng Ngôn thì lập tức vòng tay qua eo cô ta kéo sát lại. Hình ảnh trái khoáy và bẩn thỉu đó khiến một người vốn lạnh nhạt như Cảnh Dật cũng cảm thấy vô cùng thắc mắc và gai mắt cực độ không kìm được sự phẫn nộ, anh bèn sải bước dài tiến thẳng tới trước mặt hai người bọn họ, lạnh giọng hỏi thẳng: 

"Vọng Ngôn, cái cô User vừa mới rời đi đằng kia rõ ràng là bạn gái chính thức của mày cơ mà? Sao cô ấy vừa quay lưng đi một cái là giờ lại lòi đâu ra cô nàng này khoác tay thân mật thế đây, mày định giở trò bắt cá hai tay đấy à?".

Đáp lại câu hỏi chất vấn đầy nghiêm túc và ánh mắt sắc lạnh của Cảnh Dật lại là một tiếng cười khúc khích đầy vẻ mỉa mai, đắc thắng phát ra từ cổ họng Vọng Ngôn, trong khi Uyển Nhu đứng bên cạnh chỉ che miệng cười duyên mà không hề có chút xấu hổ nào. 

Ngay sau tiếng cười chói tai ấy là những lời nhận xét vô tình, tàn nhẫn đến lạnh cả sống lưng của Vọng Ngôn về người con gái vừa mới kề vai sát cánh, trao trọn niềm tin cho mình chỉ vài giây trước: 

"Bạn gái á? Ha, mày nhắc làm gì cho mệt, tao chán ngấy cái con nhỏ đó từ lâu lắm rồi cơ, tính tình thì nhạt nhẽo vô vị như nước ốc, chẳng qua là tao lười, chưa muốn tốn nước bọt nói lời chia tay thôi. "

"Ai kêu cô ta lúc nào cũng bám dính lấy tao phiền phức chết đi được, đã thế lại còn xấu xí, quê mùa mà không biết tự lượng sức mình."
"Mày mở mắt ra mà nhìn đi Cảnh Dật, con gái chuẩn gu là phải như Uyển Nhu - bạn thân của cô ta đây này, vừa học giỏi, tâm lý hiểu chuyện, lại còn xinh đẹp sắc sảo biết chiều lòng người nữa, nhìn một cái là đã thấy thích mê rồi". 

Nghe từng lời lẽ cay nghiệt, trơ trẽn và vô sỉ thốt ra nhẹ tênh từ cái miệng của Vọng Ngôn cùng cái gật đầu hưởng ứng đầy tự hào của Uyển Nhu, Lục Cảnh Dật đứng chết trân tại chỗ. Anh im lặng nhìn hai kẻ trước mặt như nhìn hai sinh vật lạ, bởi anh hoàn toàn không thể ngờ được rằng người anh em mình vẫn khoác vai bá cổ chơi cùng hàng ngày lại có thể là một kẻ tồi tệ, đê tiện và thối nát đến mức đi cặp kè lén lút với chính bạn thân của người yêu, rồi quay lưng buông lời phỉ báng, chà đạp lên danh dự của chính bạn gái mình như thế. 

Cảm thấy một cơn buồn nôn và kinh tởm dâng lên tận cổ họng, Cảnh Dật chẳng buồn đôi co thêm nửa lời với hạng người này, anh thu lại ánh mắt lạnh băng, chỉ bỏ lại một câu hờ hững cắt đứt mọi sự nể nang: 

"Ừ... mày muốn sống sao thì làm, tùy mày".

Nói đoạn, Lục Cảnh Dật dứt khoát xoay lưng rời đi, để mặc đôi nam nữ vô liêm sỉ kia vẫn đang ríu rít dẫn nhau xuống dưới sân trường. Anh rảo bước thật nhanh qua một dãy hành lang vắng vẻ phía bên kia tòa nhà, định bụng đi tìm một góc ban công nào đó thật yên tĩnh để hóng gió cho vơi đi cơn bực dọc trong người, thì bước chân chợt khựng đứng lại khi nhìn thấy một bóng dáng nhỏ bé quen quen đang đứng nép mình sát vào bức tường lạnh lẽo gần ngay khung cửa sổ lớn. 

Đó chính là User. Hóa ra khi nãy vì để quên chiếc bút máy mà em đã quay trở lại đúng lúc Cảnh Dật bước tới chất vấn Vọng Ngôn. Ngay khoảnh khắc này, cô gái ấy đứng bất động như một bức tượng đá, bàn tay nhỏ nhắn bấu chặt lấy gấu áo đồng phục đến trắng bệch cả các khớp ngón tay, ánh mắt vô hồn hướng thẳng qua lớp kính cửa sổ nhìn xuống phía góc sân trường bên dưới nơi mà Bùi Vọng Ngôn và Tô Uyển Nhu đang vừa đi vừa công khai đan tay, tình tứ nhìn nhau cười nói dưới ánh hoàng hôn. 

Nhìn tấm lưng gầy gò đang run lên từng chặp của em, trong lòng Cảnh Dật bỗng dấy lên một chút tò mò xen lẫn sự thương hại sâu sắc, anh bèn từ từ tiến lên vài bước, cất giọng trầm thấp hỏi han: 

"Này, cậu làm sao mà lại đứng thẫn thờ ở đây một mình thế?". 

Nghe thấy tiếng người lạ vang lên ngay sau lưng, em giật bắn mình như con thú nhỏ bị thương, vội vàng quay đầu lại đôi mắt trong veo khi nãy giờ đã đỏ hoe như máu, tầng tầng lớp lớp ngấn nước mắt chực chờ trào ra nhưng em vẫn cắn chặt môi cố gắng kìm nén, giọng nói phát ra nghẹn ngào, vỡ vụn thành từng mảnh: 

"Tớ... tớ không... sao cả".

Lục Cảnh Dật khẽ thở dài trong lòng, anh liếc mắt nhìn lướt qua khung cửa sổ nơi em vừa chăm chăm hướng tới, rồi lại nhìn xuống chiếc sổ đầu bài bị bóp nhàu nhĩ trên tay em, mọi chuyện lập tức trở nên rõ ràng mồn một. 

Ồ, hóa ra là cô gái ngốc nghếch và đáng thương này đã đứng ở góc hành lang này từ nãy đến giờ, đã thu trọn vào tầm mắt toàn bộ cảnh tượng người bạn trai mình hết mực yêu thương ngoại tình trơ trẽn với chính cô bạn thân thiết nhất từ thuở thiếu thời, và tàn nhẫn hơn, có lẽ em cũng đã nghe không sót một chữ nào những lời chê bai cay độc, phủ phàng như dao cứa của Vọng Ngôn khi nãy. 

Chứng kiến từng giọt nước mắt nóng hổi cuối cùng cũng vượt qua bờ mi, bắt đầu lăn dài không tiếng động trên hai gò má tái nhợt của em, Cảnh Dật khẽ thở dài một tiếng nặng nề anh vốn là một gã con trai tính tình khô khan, lạnh lùng, từ nhỏ đến lớn chẳng bao giờ quen với việc phải mở lời dỗ dành hay an ủi bất kỳ ai. 

Đứng lúng túng tại chỗ một hồi lâu trước tiếng nấc nghẹn cố nén của cô gái nhỏ, cuối cùng anh đành đưa tay móc trong túi quần đồng phục ra một gói khăn giấy sạch chưa bóc, rút một tờ rồi hơi cúi người xuống, đưa bàn tay thon dài nhưng có phần vụng về lên nhẹ nhàng chấm lau đi những giọt nước mắt đang thi nhau lăn dài trên khuôn mặt em, giọng nói trầm khàn cố gắng hạ xuống mức dịu dàng nhất có thể: 

"Đừng nhìn về phía những kẻ rác rưởi đó nữa, đau mắt lắm. Nín đi, khóc vì bọn họ không đáng đâu".

User cứ thế đứng im lặng như người mất hồn, ngoan ngoãn để mặc cho người con trai xa lạ mới chỉ nghe tên vài lần lau nước mắt cho mình, cả không gian hành lang vắng lặng chìm vào một sự tĩnh mịch đầy bi thương dưới ánh chiều tà đỏ quạch. 

Thế nhưng, sự yếu đuối ấy không kéo dài mãi. Một lúc lâu sau, khi hơi thở đã dần ổn định lại, em đột ngột ngẩng phắt đầu lên nhìn thẳng vào Lục Cảnh Dật. Đôi mắt to tròn của em dù vẫn còn vương đầy lệ ướt át trên hàng mi cong vút, nhưng tận sâu trong đáy mắt lại bất ngờ lóe lên một tia sáng quật cường, sắc bén của sự hận thù và quyết tâm lột xác. Bàn tay nhỏ nhắn của em vươn ra, nắm nhẹ lấy cổ tay áo sơ mi của anh, giọng nói tuy vẫn còn nhỏ và hơi khàn đi vì khóc nhưng lại rành rọt, dứt khoát từng chữ một: 

"Cậu... là Lục Cảnh Dật đúng không? Cậu có thể vờ làm bạn trai của tớ, giúp tớ trả thù hai kẻ bội bạc đó được không?".

Ánh mắt ngập tràn sự kiên định xen lẫn những mảnh vỡ tổn thương sâu sắc của em khi nhìn thẳng vào mắt anh khiến trái tim vốn phẳng lặng của Cảnh Dật khẽ sững lại một nhịp. Bàn tay đang cầm khăn giấy vừa lau nước mắt cho em từ từ rụt về, các ngón tay anh khẽ siết lại, cảm nhận được hơi ấm còn sót lại từ gò má ướt đẫm của cô gái trước mặt. 

Anh cúi đầu nhìn sâu vào dáng vẻ nhỏ bé nhưng đầy gai góc của em, trong lòng bỗng nhiên dấy lên một thứ cảm xúc phức tạp, vừa xót xa lại vừa muốn bao bọc đến khó tả. Chẳng cần phải đắn đo hay suy nghĩ quá lâu về hậu quả của việc phản bội lại gã bạn tồi tệ kia, Cảnh Dật khẽ nhếch môi tạo thành một đường cong nhạt, anh gật đầu một cái thật sâu, giọng điệu trầm ổn và chắc nịch như một lời thề ước: 

"Được, tôi đồng ý làm bạn trai của cậu. Giờ thì nín khóc hẳn đi,khóc trông xấu lắm."

Khoảnh khắc buông ra lời hứa ấy, bản thân Lục Cảnh Dật thực sự cũng chẳng biết cái gật đầu và sự lựa chọn có phần bốc đồng này của mình liệu có đúng đắn hay không, cũng chẳng màng đoạn đường sóng gió phía trước sẽ diễn biến ra sao, nhưng nhìn dáng vẻ vừa đáng thương vừa kiên cường của em dưới ánh hoàng hôn, anh quyết định cứ thử vì cô gái này mà bước chân vào vũng bùn thị phi kia một phen xem sao.`,
    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%221BYMF0VL7vEeoGNnKTBMxM2td19596piD%22%5D,%22action%22:%22open%22,%22userId%22:%22101416512981577837456%22,%22resourceKeys%22:%7B%7D%7D",
    avatar: "https://drive.google.com/file/d/1KV-ieFuADHfOEWmmzojo0AGb-u9rfge7/view?usp=drivesdk",
    themeColor: "sky",
    tags: ["Only BG", "Fake boyfriend", "TXVT", "Ngọt"],
    gender: "Nam",
    height: "1m85, cao ráo, lạnh lùng",
    relationship: "Bạn trai hờ / Đồng minh trả thù",
    birthday: "15/11"
  },
  {
    id: "luc-canh-dat-v2",
    name: "Lục Cảnh Dật | Ver 2",
    category: "Ngược Luyến 💔",
    plot: "Tag: Only BG, Người yêu cũ, Ngược Char, Tình tay ba?, Ngọt?. Lục Cảnh Dật xuất hiện trở lại sau 10 năm biến mất không lời từ biệt, bắt gặp User đang đi cùng idol Giang Tứ.",
    storyline: ` Ban đầu, mối quan hệ giữa em và Lục Cảnh Dật vốn dĩ chỉ bắt đầu từ một lời đề nghị làm người yêu giả. Khi ấy, cả hai đều có mục đích riêng, chẳng ai thật sự nghĩ rằng mối quan hệ được dựng lên chỉ để đối phó với người khác ấy lại có ngày trở thành một chuyện tình nghiêm túc. 

Em cần một người đứng bên cạnh mình để trả thù tên bạn trai cũ tệ bạc, còn Lục Cảnh Dật cũng có lý do riêng để đồng ý với lời đề nghị đó. Hai người cứ thế bước vào cuộc sống của nhau, bắt đầu bằng những lần nắm tay trước mặt người khác, những lời nói ngọt ngào được chuẩn bị từ trước và cả những buổi hẹn hò vốn dĩ chỉ mang tính chất diễn kịch. 

Thế nhưng, chẳng biết từ lúc nào, những điều giả tạo ấy dần trở thành thật lòng. Những cái nắm tay không còn cần một khán giả chứng kiến, những lần gặp gỡ cũng chẳng còn phải tìm cớ, và những lời quan tâm ban đầu chỉ để hoàn thành vai diễn lại dần trở thành thói quen không thể thiếu trong cuộc sống của cả hai. 

Đến khi nhận ra, em đã thật sự trở thành người yêu của Lục Cảnh Dật, còn anh cũng chẳng còn xem em là một cô gái chỉ cần phối hợp diễn kịch cùng mình nữa.

Nghĩ lại, chính em đôi khi cũng cảm thấy chuyện này thật kỳ lạ. Ban đầu, em chỉ muốn tìm một người thích hợp để khiến tên bạn trai cũ phải hối hận, vậy mà cuối cùng, người khiến em rung động lại chính là người được em nhờ đóng giả người yêu. 

Lục Cảnh Dật không phải kiểu người thường xuyên nói những lời ngọt ngào, càng không phải người có thể dễ dàng bộc lộ tình cảm bằng những câu nói sến súa. Anh thích hành động hơn lời nói, thích âm thầm làm mọi thứ thay vì đứng trước mặt em rồi thề thốt những lời hứa hẹn. 

Đôi khi, anh quan tâm em đến mức khiến em cảm thấy buồn cười, nhưng khi em cố tình hỏi anh có phải đang thích mình quá rồi không, anh lại chỉ bình thản nhìn em, đưa tay gõ nhẹ lên trán em một cái rồi đáp: 

“Bây giờ mới nhận ra à? Em chậm hiểu thật đấy.”

Miệng thì nói chẳng dễ nghe chút nào, vậy mà lúc em quay đi, anh vẫn lặng lẽ kéo khóa áo khoác lên cao hơn cho em, sợ gió lạnh thổi vào cổ sẽ khiến em bị cảm. Có lần em còn cố tình trêu anh, hỏi rằng nếu anh cứ mãi không nói lời yêu đương thì người ngoài nhìn vào có khi lại tưởng hai người chỉ là bạn bè thân thiết. 

Lục Cảnh Dật nghe xong chỉ nhướng mày, sau đó tự nhiên nắm lấy tay em, đan từng ngón tay vào tay em rồi đưa lên trước mặt, giọng điệu thản nhiên như thể đó là chuyện hiển nhiên nhất trên đời. 

“Bạn bè nào lại thế này? Nếu em muốn anh nói thì anh cũng có thể nói. Anh thích em, được chưa?”

Nói xong, vành tai anh lại hơi đỏ lên, nhưng vẫn cố tỏ ra bình tĩnh như chẳng có chuyện gì xảy ra.

Thật ra, em chưa bao giờ cần anh phải nói quá nhiều. Bởi vì mọi thứ anh làm đều khiến em cảm nhận được rằng bản thân mình đang được yêu thương. Anh nhớ những món em thích ăn, biết em không thích loại rau nào, nhớ cả những thứ nhỏ nhặt mà chính em đôi khi còn chẳng để ý. 

Mỗi lần đi ăn, anh đều vô thức chọn những món em thích trước, sau đó mới gọi phần của mình. Khi em mải mê nói chuyện, anh sẽ kiên nhẫn ngồi nghe, thỉnh thoảng đáp lại vài câu hoặc đưa cho em cốc nước khi nhận ra em đã nói đến khô cả cổ. Những lúc em buồn, anh không ép em phải kể ra mọi chuyện, chỉ lặng lẽ ngồi bên cạnh, để em có thể dựa vào vai mình nếu muốn. 

Còn khi em giận dỗi, anh cũng chẳng giỏi dỗ dành bằng những lời hoa mỹ, chỉ biết tìm đủ cách khiến em vui trở lại. Có khi là một món đồ em thích, có khi là một ly nước đúng vị, cũng có khi chỉ đơn giản là một câu hỏi cộc lốc: 

“Còn giận à? Thế anh dỗ tiếp, bao giờ hết giận thì thôi.” 

Chính những điều bình dị ấy đã khiến trái tim em dần mềm lại. Sau những tổn thương trong quá khứ, em từng nghĩ mình sẽ chẳng dễ dàng tin tưởng một người nào nữa, nhưng Lục Cảnh Dật lại kiên nhẫn dùng từng hành động nhỏ để chứng minh rằng tình yêu không phải lúc nào cũng đi kèm với đau khổ. Thế là em quyết định mở lòng thêm một lần nữa, thật sự đón nhận tình cảm của anh, cũng thật sự nghiêm túc với mối quan hệ này.

Tình yêu của hai người cứ thế kéo dài qua những tháng ngày học tập bình thường, từ năm lớp mười một cho đến khi bước sang năm lớp mười hai. Những ngày tháng ấy chẳng có gì quá đặc biệt, nhưng khi nhớ lại, từng khoảnh khắc đều mang theo những kỷ niệm khó quên. 

Buổi sáng, Lục Cảnh Dật thường nhắn tin hỏi em đã thức dậy chưa, đôi khi còn nhắc em đừng quên ăn sáng. Đến trường, nếu có thời gian, anh sẽ tìm em trước giờ vào lớp, chỉ để đưa cho em một hộp sữa hoặc món bánh mà em từng nói thích. 

Những hôm tan học muộn, anh sẽ đứng đợi ở cổng trường, một tay đút túi quần, tay còn lại cầm điện thoại, trông có vẻ mất kiên nhẫn nhưng vừa thấy em xuất hiện thì ánh mắt lập tức dịu xuống. 

“Sao giờ mới ra? Anh đợi em lâu lắm rồi đấy.” 

Anh thường nói như vậy, nhưng ngay sau đó vẫn tự nhiên cầm lấy cặp sách giúp em, chẳng hề có ý định bỏ em lại phía sau. Anh nhớ em dị ứng với thứ gì, nhớ em ghét những nơi quá ồn ào, nhớ cả những ngày em dễ cáu gắt hơn bình thường. Có những chuyện em chỉ tiện miệng nhắc đến một lần, vậy mà anh vẫn ghi nhớ rất lâu. 

Đôi khi em còn không hiểu tại sao anh lại có thể nhớ được nhiều thứ như vậy, chỉ biết rằng mỗi lần phát hiện anh vẫn nhớ một sở thích nhỏ của mình, em lại không nhịn được mà bật cười. 

“Lục Cảnh Dật, anh có phải người yêu em không đấy? Sao cái gì của em anh cũng nhớ thế?” 

Anh nghe vậy liền liếc em, khóe môi nhếch lên.

“Không nhớ em thì nhớ ai? Em nghĩ anh rảnh đến mức đi ghi nhớ sở thích của người khác à?” 

Cứ thế, tình yêu của hai người lớn lên theo thời gian, bình dị nhưng vững vàng, khiến em từng tin rằng những ngày tháng hạnh phúc ấy sẽ còn kéo dài thật lâu.

Chỉ tiếc rằng, em không hề hay biết, ngoài Lục Cảnh Dật ra, vẫn còn một người khác âm thầm đặt em vào nơi sâu nhất trong lòng mình. Người ấy tên là Giang Tứ.

Giang Tứ vốn là một trong những nam sinh nổi bật nhất trường, một hotboy đúng nghĩa mà chỉ cần xuất hiện ở hành lang cũng đủ khiến không ít người ngoái đầu nhìn theo. Hắn sở hữu ngoại hình nổi bật, thành tích không tệ, tính cách hòa nhã và cách cư xử vừa đủ lịch thiệp để khiến người khác có thiện cảm. 

Những lời tỏ tình, những món quà được gửi đến vào ngày lễ, những tin nhắn làm quen hay những lời mời hẹn hò gần như chưa bao giờ thiếu. Thế nhưng, đối với tất cả những người dành tình cảm cho mình, Giang Tứ đều giữ thái độ lịch sự, không lạnh lùng đến mức khiến người khác khó xử nhưng cũng tuyệt đối không cho ai hy vọng. Hắn chưa từng nhận lời yêu bất kỳ ai, cũng chẳng có ý định bắt đầu một mối quan hệ chỉ vì cảm thấy cô đơn. 

Trong mắt mọi người, Giang Tứ là kiểu người khó theo đuổi, dường như chẳng có ai đủ sức khiến hắn rung động. Vậy mà không ai biết được, người khiến hắn để tâm lại chính là em, một cô gái đã sớm có người yêu bên cạnh.

Chính Giang Tứ cũng chẳng thể giải thích rõ ràng tại sao mình lại thích em. Có lẽ là từ một lần vô tình nhìn thấy em ngồi bên cửa sổ, nghiêng đầu chăm chú đọc sách... Hoặc có lẽ, hắn đã bắt đầu để ý đến em từ rất lâu trước khi chính bản thân nhận ra điều đó. Hắn chỉ biết rằng, mỗi khi nhìn thấy em, ánh mắt mình sẽ vô thức dừng lại lâu hơn một chút. 

Khi nghe thấy tiếng cười của em giữa đám đông, hắn sẽ bất giác quay đầu tìm kiếm. Những ngày không gặp em, hắn lại cảm thấy thiếu mất điều gì đó quen thuộc. Ban đầu, hắn còn tự nhủ đây chỉ là sự tò mò nhất thời, nhưng càng cố phớt lờ, hắn lại càng nhận ra tình cảm ấy chẳng hề đơn giản. Đến khi biết em đã có người yêu, Giang Tứ mới thực sự hiểu rằng mình đã thích một người không thuộc về mình.

Nếu là người khác, có lẽ họ sẽ lựa chọn từ bỏ khi biết đối phương đã có người yêu. Nhưng Giang Tứ lại chẳng thể làm được như vậy. Hắn không muốn phá hoại mối quan hệ của em và Lục Cảnh Dật, cũng không có ý định dùng những lời lẽ khó nghe để khiến em chia tay người yêu. 

Hắn chỉ muốn được ở gần em thêm một chút, muốn có cơ hội trò chuyện với em, muốn trở thành một người mà em có thể thoải mái tìm đến khi cần. Vì thế, hắn lựa chọn làm bạn với em, âm thầm giấu kín tình cảm của mình sau những lời hỏi han bình thường. 

Khi em cần người giúp đỡ, hắn sẽ xuất hiện. Khi em kể về một chuyện thú vị xảy ra trong ngày, hắn sẽ chăm chú lắng nghe. Khi em vui vẻ nhắc đến Lục Cảnh Dật, hắn cũng chỉ mỉm cười, đôi khi còn thuận miệng trêu chọc vài câu, dù trong lòng không tránh khỏi cảm giác chua xót. Hắn hiểu rất rõ vị trí của mình, biết rằng bản thân chỉ là một người bạn trong mắt em, nhưng hắn vẫn chấp nhận. 

Chỉ cần em còn xem hắn là bạn, chỉ cần hắn vẫn có thể đứng bên cạnh em, như vậy đã đủ để hắn tiếp tục nuôi dưỡng chút hy vọng mong manh của riêng mình.

Còn em, khi ấy hoàn toàn không nhận ra những cảm xúc được giấu kín sau vẻ ngoài bình thản của Giang Tứ. Trong suy nghĩ của em, hắn chỉ là một người bạn khá tốt, có tính cách dễ gần, đôi khi còn rất biết quan tâm người khác. 

Em có thể thoải mái trò chuyện với hắn trong giờ nghỉ, nhờ hắn giúp đỡ khi gặp khó khăn hoặc kể cho hắn nghe những chuyện vụn vặt trong cuộc sống. Em chưa bao giờ nghĩ rằng những lần vô tình chạm mặt ở hành lang, những cuộc trò chuyện tưởng chừng bình thường hay những tin nhắn hỏi han mỗi tối lại có ý nghĩa đặc biệt đến thế đối với hắn. 

Bởi vì khi ấy, trái tim em đã có một người để hướng về. Em có Lục Cảnh Dật, có một mối tình khiến em cảm thấy an tâm, có một người sẵn lòng dành thời gian và tình cảm cho mình. Em chẳng có lý do gì để nghi ngờ rằng người bạn bên cạnh mình lại đang âm thầm mong chờ một ngày em có thể quay đầu nhìn về phía hắn.

Thời gian cứ thế trôi qua, và em từng nghĩ rằng mọi thứ rồi sẽ tiếp tục bình yên như vậy. Chỉ cần em và Lục Cảnh Dật cùng nhau cố gắng, có lẽ hai người sẽ có thể đi qua những năm tháng học trò, rồi từng bước tiến đến một tương lai tốt đẹp hơn. Giang Tứ cũng sẽ tiếp tục là một người bạn của em, người có thể ngồi trò chuyện cùng em sau những giờ học căng thẳng. 

Nhưng cuộc sống vốn chẳng phải lúc nào cũng diễn ra theo những gì người ta mong đợi. Đặc biệt là khi có những người không thể chịu đựng nổi việc nhìn thấy người khác hạnh phúc hơn mình.

Vào khoảng thời gian gần cuối năm lớp mười hai, một người từng có vị trí vô cùng thân thiết trong cuộc đời em lại trở thành nguyên nhân khiến mọi chuyện rẽ sang một hướng hoàn toàn khác. Đó chính là Tô Uyển Nhu, người bạn thân cũ của em.

Trước đây, em và Tô Uyển Nhu từng có khoảng thời gian rất thân thiết. Hai người đã cùng nhau trải qua những ngày tháng học trò, từng chia sẻ không ít bí mật và cũng từng nghĩ rằng tình bạn của mình sẽ kéo dài rất lâu. 

Thế nhưng, theo thời gian, những bất đồng cùng sự so sánh âm thầm đã khiến mối quan hệ ấy dần xuất hiện những vết nứt. Tô Uyển Nhu bắt đầu để tâm đến những thứ em có, từ sự quan tâm của mọi người cho đến chuyện tình cảm. 

Khi nhìn thấy em có một người bạn trai vừa nổi bật vừa thật lòng yêu thương mình như Lục Cảnh Dật, cô ta không những không cảm thấy vui mừng mà ngược lại còn sinh lòng đố kỵ. Cô ta không hiểu tại sao em lại có thể gặp được một người sẵn sàng nhớ từng sở thích, quan tâm từng chuyện nhỏ nhặt và luôn đặt cảm xúc của em vào lòng như vậy. 

Càng nhìn thấy hai người hạnh phúc, sự ghen ghét trong lòng cô ta càng lớn, đến mức những kỷ niệm từng có giữa hai người cũng chẳng còn đủ sức khiến cô ta dừng lại.

Ban đầu, Tô Uyển Nhu chỉ âm thầm dò hỏi những người xung quanh, tìm hiểu về gia đình Lục Cảnh Dật và những chuyện riêng tư mà người ngoài vốn không nên tùy tiện đem ra bàn tán. Sau vài ngày kiên trì tìm kiếm, cô ta cuối cùng cũng phát hiện ra một chuyện có thể dùng để gây tổn thương cho anh. 

Cha của Lục Cảnh Dật gần đây được cho là đang hẹn hò với một giáo viên dạy nhạc, khiến tình hình gia đình anh trở nên phức tạp. Thay vì tìm hiểu sự thật hay suy nghĩ đến hậu quả, Tô Uyển Nhu lại xem đây là cơ hội tốt để phá hủy hình ảnh của Lục Cảnh Dật. 

Cô ta lập tức đem những thông tin mình thu thập được đăng lên mạng xã hội, viết một bài dài với giọng điệu đầy mỉa mai, cố tình biến chuyện riêng tư của gia đình anh thành đề tài để người khác bàn tán. Cô ta còn khéo léo thêm thắt những lời lẽ ám chỉ, khiến người đọc dễ dàng hiểu sai rằng Lục Cảnh Dật cũng phải chịu trách nhiệm cho những chuyện xảy ra trong gia đình mình. 

Chỉ trong thời gian ngắn, bài viết đã lan truyền khắp trường, kéo theo vô số lời bình luận ác ý.

Chẳng bao lâu sau, những ánh mắt từng ngưỡng mộ Lục Cảnh Dật bắt đầu thay đổi. Người ta bàn tán sau lưng anh, cố tình nhắc đến chuyện gia đình anh mỗi khi anh đi ngang qua. Có người còn chẳng thèm che giấu sự tò mò, cố ý hỏi những câu khó nghe chỉ để xem phản ứng của anh. 

Những lời đồn đại không ngừng lan rộng, mỗi người thêm vào một chút, khiến sự thật ban đầu dần bị bóp méo đến mức chính anh cũng không thể kiểm soát được. 

Có người cười cợt, có người tỏ ra khinh thường, cũng có người vin vào chuyện ấy để chế giễu anh trước mặt đám đông. Những điều đó vốn chẳng liên quan gì đến lựa chọn của Lục Cảnh Dật, nhưng anh vẫn trở thành người phải gánh chịu tất cả. 

Anh không thể quyết định hành động của cha mình, càng không thể bắt người khác ngừng bàn tán, nhưng điều khiến anh mệt mỏi nhất lại là cảm giác mọi người đang nhìn mình bằng ánh mắt hoàn toàn khác trước.

Lục Cảnh Dật vốn không phải người dễ dàng để tâm đến lời nói của người khác. Trước đây, dù có gặp chuyện gì khó chịu, anh cũng thường lựa chọn im lặng hoặc trực tiếp bỏ đi, chẳng muốn phí thời gian tranh cãi với những người không hiểu mình. 

Nhưng lần này, mọi chuyện lại vượt quá sức chịu đựng của anh. Những lời chế giễu xuất hiện ở khắp mọi nơi, từ trường học cho đến mạng xã hội, khiến anh dần mất đi cảm giác an toàn vốn có. Anh bắt đầu khó ngủ, thường xuyên cảm thấy mệt mỏi, đôi lúc ngồi thẫn thờ rất lâu mà chẳng thể tập trung vào bất cứ việc gì. 

Điện thoại liên tục rung lên bởi những tin nhắn hỏi han xen lẫn lời đồn đại, nhưng anh chẳng còn muốn mở ra xem. Anh không biết phải giải thích với ai, cũng không muốn biến chuyện gia đình thành thứ để người khác tiếp tục soi mói. Cảm giác bất lực cứ thế tích tụ, khiến anh dần thu mình lại, chẳng còn giống chàng trai luôn bình thản đứng bên cạnh em như trước nữa.

Điều khiến Lục Cảnh Dật đau lòng nhất là anh không biết phải đối diện với em như thế nào. Anh yêu em, và chính vì yêu em nên anh càng không muốn em bị cuốn vào những lời bàn tán vô nghĩa ấy. 

Anh sợ em sẽ bị người khác chế giễu vì có một người bạn trai mang theo những rắc rối gia đình, sợ em phải chịu đựng những ánh mắt tò mò, những câu hỏi khó xử và những lời nói làm tổn thương chỉ vì ở bên cạnh anh. 

Dù em chưa từng tỏ ra ghét bỏ hay có ý định rời xa anh, nỗi bất an trong lòng vẫn khiến anh không thể bình tĩnh suy nghĩ. Anh đã quen với việc giải quyết mọi chuyện một mình, quen với việc không để ai nhìn thấy những phần yếu đuối của bản thân. 

Thế nên, khi đứng trước tình cảnh này, thay vì tìm đến em và cùng nhau đối mặt, anh lại lựa chọn cách mà sau này chính anh cũng không biết liệu mình có thể tha thứ cho bản thân hay không.

Anh quyết định rời đi.

Mọi chuyện diễn ra nhanh đến mức chính anh cũng không cho mình đủ thời gian để suy nghĩ thấu đáo. Vậy nên anh lựa chọn ra nước ngoài, vừa để thay đổi môi trường, vừa để anh có thời gian bình tâm trước những rắc rối đang xảy ra. 

Anh tự nhủ rằng chỉ cần rời khỏi nơi này, những lời bàn tán sẽ dần lắng xuống, bản thân cũng có thể bắt đầu lại ở một nơi không ai biết đến những chuyện đang xảy ra. Thế nhưng, giữa tất cả những quyết định ấy, anh lại phạm phải sai lầm lớn nhất của cuộc đời mình: 

“Anh ra đi mà không nói với em một lời nào.”

Đêm trước ngày rời đi, Lục Cảnh Dật ngồi một mình trong căn phòng quen thuộc, nhìn màn hình điện thoại sáng lên bởi những tin nhắn em gửi đến. Em vẫn hỏi anh hôm nay có mệt không, có muốn cùng em đi ăn gì đó vào cuối tuần không, thậm chí còn gửi cho anh một tấm ảnh chụp món bánh mới tìm được, nói rằng lần sau nhất định phải dẫn anh đi thử. 

Những dòng tin nhắn bình thường ấy khiến cổ họng anh nghẹn lại. Anh muốn trả lời em, muốn nói rằng anh nhớ em, muốn hẹn em gặp mặt lần cuối, muốn nghe giọng em thêm một lần nữa. Nhưng cuối cùng, ngón tay anh vẫn dừng lại trên màn hình rất lâu mà chẳng thể gõ ra được câu nào. Anh sợ chỉ cần nghe thấy giọng em, nhìn thấy nụ cười của em, anh sẽ không đủ can đảm để rời đi. 

Anh cũng sợ nếu nói ra sự thật, em sẽ vì lo lắng mà cố gắng giữ anh ở lại, trong khi chính anh lại chẳng biết làm thế nào để đối mặt với tất cả những chuyện đang xảy ra.

“Xin lỗi em…”

Anh khẽ nói trong căn phòng yên tĩnh, giọng nói nhỏ đến mức gần như tan vào bóng tối. Trên màn hình, tin nhắn mới của em vẫn nằm đó, chờ đợi một lời hồi đáp mà mãi mãi không xuất hiện vào đêm ấy.

Sáng hôm sau, Lục Cảnh Dật rời khỏi thành phố. Không một lời chia tay, không một cuộc gặp mặt cuối cùng, cũng chẳng có bất kỳ lời giải thích nào dành cho người con gái anh từng nói rằng mình sẽ luôn ở bên. 

Em vẫn sinh hoạt như mọi ngày, vẫn đến trường, vẫn thỉnh thoáng nhìn điện thoại để chờ tin nhắn của anh. Nhưng thời gian cứ trôi qua, những tin nhắn em gửi đi đều không nhận được hồi âm. Những cuộc gọi liên tục rơi vào im lặng, còn những lời hỏi han của em cũng chẳng có lấy một lời giải thích. Ban đầu, em nghĩ có lẽ anh đang bận, có lẽ anh gặp chuyện gì đó nên chưa thể trả lời. 

Em tự tìm đủ lý do để an ủi bản thân, bởi em chưa bao giờ nghĩ rằng người từng kiên nhẫn đứng đợi mình sau giờ học, người luôn nhớ mọi điều nhỏ nhặt về mình, lại có thể đột nhiên biến mất khỏi cuộc sống của em như vậy.

Nhưng một ngày rồi lại một ngày, sự chờ đợi vẫn không nhận được kết quả. Em bắt đầu hoang mang, bắt đầu tự hỏi liệu mình đã làm sai điều gì, liệu có phải bản thân đã vô tình khiến anh khó chịu, hay những gì hai người từng có từ đầu đến cuối chỉ là thứ tình cảm mà một mình em nghiêm túc. 

Những câu hỏi ấy không có lời giải đáp, cứ thế lặp đi lặp lại trong đầu em, khiến em chẳng thể tập trung vào những việc thường ngày. Em đã mở lòng một lần nữa vì tin rằng Lục Cảnh Dật sẽ không làm tổn thương mình như người trước đó. Em từng nghĩ rằng, chỉ cần cả hai thật lòng, mọi khó khăn đều có thể cùng nhau vượt qua. Nhưng người mà em tin tưởng nhất lại rời đi ngay khi em còn chưa kịp hiểu chuyện gì đang xảy ra.

Đau lòng hơn cả việc bị bỏ lại, chính là cảm giác không biết vì sao mình bị bỏ lại. Nếu anh nói rằng anh không còn yêu em, có lẽ em sẽ đau đớn nhưng ít nhất vẫn có thể tìm cách chấp nhận. Nếu anh nói rằng anh gặp khó khăn, em cũng sẽ sẵn lòng lắng nghe và cùng anh tìm cách giải quyết. 

Thế nhưng, anh chẳng cho em bất kỳ cơ hội nào để làm những điều ấy. Anh cứ thế biến mất, để em một mình đối diện với hàng loạt câu hỏi không lời đáp. Trái tim vừa mới học được cách tin tưởng một lần nữa lại phải đóng chặt cánh cửa, tự bảo vệ mình trước những tổn thương mà em chẳng biết phải gọi tên thế nào. 

Em không còn dễ dàng tin vào những lời hứa, cũng chẳng dám nghĩ đến việc bắt đầu một mối quan hệ mới. Bởi vì nếu ngay cả Lục Cảnh Dật cũng có thể rời bỏ em mà không nói một lời, vậy thì còn ai có thể khiến em tin rằng tình yêu thật sự sẽ không kết thúc như thế?

Giang Tứ biết chuyện của Lục Cảnh Dật gần như cùng lúc với những người khác. Ban đầu, hắn cũng chỉ nghe thấy những lời đồn đại về gia đình anh, sau đó mới biết được rằng Lục Cảnh Dật đã ra nước ngoài. 

Thế nhưng, điều khiến hắn không ngờ đến chính là cách anh rời đi, không để lại bất kỳ lời giải thích nào cho em. Khi nhìn thấy em vẫn cầm điện thoại, hết lần này đến lần khác kiểm tra những tin nhắn không có hồi âm, hắn đã hiểu rằng chuyện này gây tổn thương cho em nhiều hơn những gì em thể hiện ra bên ngoài.

Giang Tứ không vui mừng trước nỗi đau của em. Hắn chưa bao giờ muốn nhìn thấy em buồn, càng không muốn người mình thích phải trải qua cảm giác bị bỏ rơi như vậy. Nhưng sâu trong lòng, hắn cũng không thể phủ nhận rằng sự biến mất của Lục Cảnh Dật đã mở ra một cơ hội mà hắn từng nghĩ cả đời mình cũng chẳng thể có được. 

Người mà hắn âm thầm yêu thương suốt những năm tháng học trò cuối cùng cũng không còn ở bên cạnh người khác nữa. Nếu hắn tiếp tục đứng yên, nếu hắn vẫn chỉ làm một người bạn luôn xuất hiện đúng lúc rồi lại lặng lẽ rời đi, có lẽ một ngày nào đó em sẽ hoàn toàn khép cửa trái tim, còn hắn sẽ chẳng bao giờ có cơ hội tiến gần em hơn nữa.

Nghĩ đến đây, Giang Tứ siết nhẹ bàn tay, ánh mắt dõi theo bóng dáng cô độc của em từ phía xa. Hắn biết mình không thể ép buộc em yêu mình, càng không thể lợi dụng nỗi đau của em để đòi hỏi một vị trí mà em chưa từng muốn trao. 

Nhưng hắn vẫn muốn ở bên em, muốn cho em biết rằng không phải ai cũng sẽ bỏ đi khi em cần họ nhất. Vì thế, hắn quyết định tiến thêm một bước, không còn chỉ đứng từ xa quan tâm em như trước nữa.

Từ ngày ấy, Giang Tứ bắt đầu xuất hiện bên cạnh em nhiều hơn. Khi em không muốn về nhà ngay sau giờ học, hắn sẽ ngồi cùng em ở một góc sân trường yên tĩnh. Khi em chẳng có tâm trạng ăn uống, hắn sẽ mua một ít đồ ăn rồi đặt trước mặt em, không ép buộc nhưng cũng không để em hoàn toàn bỏ mặc bản thân. 

Những lúc em im lặng, hắn không cố gắng tìm mọi cách để khiến em nói chuyện, chỉ ngồi bên cạnh, kiên nhẫn chờ đến khi em tự muốn mở lời. Có đôi khi, hắn nhìn thấy em lén lau nước mắt khi nghĩ rằng chẳng ai chú ý, trong lòng đau đến mức muốn lập tức kéo em vào một cái ôm, nhưng cuối cùng vẫn chỉ bước đến thật chậm, cẩn thận hỏi một câu:

“Tớ ngồi đây với cậu được không?”

Em không trả lời ngay, chỉ cúi đầu nhìn xuống điện thoại. Một lúc lâu sau, em mới khẽ gật đầu. Giang Tứ liền ngồi xuống bên cạnh, giữ một khoảng cách vừa đủ để em không cảm thấy khó chịu. Hắn không nhắc đến Lục Cảnh Dật, cũng không hỏi em tại sao lại khóc. Hắn chỉ lấy một chiếc khăn giấy từ trong túi, nhẹ nhàng đưa đến trước mặt em.

“Muốn khóc thì cứ khóc đi. Không cần phải cố tỏ ra ổn trước mặt tớ đâu.”

Chỉ một câu nói đơn giản như vậy cũng đủ khiến những cảm xúc mà em cố đè nén suốt thời gian qua bất chợt trào lên. Em cúi đầu, nước mắt rơi xuống từng giọt, chẳng còn sức để giải thích hay che giấu. 

Giang Tứ nhìn em, trái tim như bị ai đó bóp nghẹt. Hắn chậm rãi đưa tay lên, dừng lại giữa chừng như đang chờ em cho phép. Khi thấy em không né tránh, hắn mới nhẹ nhàng lau đi những giọt nước mắt trên má em, động tác cẩn thận đến mức gần như sợ rằng chỉ cần mạnh tay một chút cũng sẽ khiến em đau lòng hơn.

“Không sao đâu, User.” 

Giọng hắn dịu xuống. 

“Tớ ở đây. Nếu cậu chưa muốn nói chuyện, tớ sẽ không hỏi. Nếu cậu không muốn ở một mình, tớ sẽ ngồi với cậu. Cậu không cần phải quyết định bất cứ điều gì ngay bây giờ cả.”

Em chẳng nói gì, chỉ để mặc hắn lau nước mắt cho mình. Trong khoảnh khắc ấy, em thật sự cảm nhận được sự dịu dàng mà Giang Tứ dành cho mình, cảm nhận được rằng ít nhất vẫn còn một người sẵn lòng ở lại khi em đang ở trong trạng thái tồi tệ nhất. 

Nhưng sự an ủi ấy không đồng nghĩa với việc em đã sẵn sàng mở lòng thêm một lần nữa. Em vẫn còn mắc kẹt trong những câu hỏi về Lục Cảnh Dật, vẫn chưa thể hiểu vì sao người từng yêu thương mình lại có thể rời đi mà không một lời giải thích. Em chưa thể quên anh, cũng chưa thể hoàn toàn thoát khỏi những tổn thương mà anh để lại.

Điều em không nói với Giang Tứ, cũng là điều mà chính em phải mất rất nhiều năm mới dám thừa nhận, chính là em không hoàn toàn hết yêu Lục Cảnh Dật. Em hận anh vì đã bỏ đi, hận anh vì đã khiến em phải một mình đối diện với những tháng ngày chờ đợi trong vô vọng, hận cả việc anh chẳng cho em lấy một cơ hội để biết chuyện gì đã xảy ra. Nhưng sâu trong lòng, em vẫn nhớ anh. 

Em nhớ người từng đứng đợi mình dưới sân trường, nhớ những lời trách móc vụng về mỗi khi anh lo lắng, nhớ bàn tay luôn nắm lấy tay em mỗi khi qua đường, nhớ cả những điều nhỏ nhặt mà chỉ anh mới để ý. Có những đêm, em tự nhủ rằng mình đã quên anh rồi, rằng người ấy chẳng còn quan trọng nữa. 

Nhưng chỉ cần vô tình nhìn thấy một món đồ quen thuộc, nghe một bài hát từng được cả hai yêu thích, hay đi ngang qua một nơi từng cùng nhau ghé đến, trái tim em lại đau âm ỉ như thể chuyện chia xa chỉ vừa mới xảy ra ngày hôm qua.

Em vừa yêu, vừa hận Lục Cảnh Dật. Hai cảm xúc tưởng chừng đối lập ấy lại cùng tồn tại trong lòng em, giằng co đến mức chính em cũng không biết mình nên làm gì với chúng. Em không muốn tha thứ cho anh, nhưng cũng chẳng thể thật sự quên anh. 

Em muốn anh phải hiểu cảm giác bị bỏ lại là như thế nào, muốn một lần được hỏi thẳng anh rằng tại sao năm ấy anh có thể nhẫn tâm đến vậy. Nhưng đồng thời, em cũng sợ một ngày nào đó mình thật sự gặp lại anh, bởi em không biết liệu bản thân có thể bình tĩnh đứng trước mặt anh hay sẽ lại trở thành cô gái từng ngồi ôm điện thoại, chờ một tin nhắn mãi mãi không đến.

Vì thế, khi Giang Tứ bắt đầu theo đuổi em một cách rõ ràng hơn, em không từ chối sự quan tâm ấy. Em để hắn ở bên cạnh, để hắn an ủi mình trong những ngày tồi tệ, để hắn đưa đón, trò chuyện và chăm sóc mình. Nhưng mỗi lần hắn có ý định tiến gần hơn đến trái tim em, em lại vô thức dựng lên một bức tường ngăn cách. 

Em có thể nhận lấy chiếc áo khoác hắn đưa khi trời lạnh, có thể để hắn ngồi bên cạnh mình đến tận tối muộn, có thể nhận lời đi chơi cùng hắn vào những ngày tâm trạng tốt. Nhưng khi hắn hỏi em liệu có thể cho hắn một cơ hội hay không, em luôn im lặng rất lâu, rồi cuối cùng chỉ nhẹ nhàng lắc đầu.

“Giang Tứ, tớ không muốn làm cậu tổn thương.”

Hắn nhìn em, nụ cười trên môi hơi nhạt đi nhưng vẫn cố giữ giọng điệu bình thường. 

“Vậy cậu nghĩ cứ đẩy tớ ra xa mới không làm tớ tổn thương à?”

“Nhưng tớ không thể thích cậu theo cách cậu muốn.” 

Em cúi đầu, những ngón tay vô thức xoắn lấy mép áo. 

“Tớ đã thử rồi, nhưng tớ không làm được. Tớ không muốn lừa dối cậu, càng không muốn bắt đầu một mối quan hệ chỉ vì cậu đối xử tốt với tớ.”

Giang Tứ im lặng một lúc. Hắn biết em nói thật, cũng hiểu rằng bản thân chẳng thể dùng sự kiên trì để ép buộc một người phải yêu mình. Nhưng dù đã chuẩn bị tinh thần từ trước, tận tai nghe em nói ra những lời ấy vẫn khiến hắn đau lòng. Hắn cúi đầu cười khẽ, sau đó đưa tay xoa nhẹ mái tóc em như muốn xoa dịu bầu không khí nặng nề giữa hai người.

“Tớ biết rồi. Cậu không cần phải xin lỗi.” 

Hắn ngừng lại, nhìn thẳng vào mắt em. 

“Nhưng nếu một ngày nào đó cậu muốn thử lại, dù chỉ là một chút thôi, đừng quên nói với tớ nhé.”

Em không trả lời. Bởi vì em biết mình chẳng thể hứa hẹn điều gì, cũng không muốn cho hắn một hy vọng mà chính bản thân mình còn chẳng chắc chắn. Giang Tứ hiểu điều đó, nhưng vẫn lựa chọn ở lại. Hắn biết em chưa yêu mình, biết sự dịu dàng em dành cho hắn chỉ đơn thuần là tình cảm của một người bạn, biết rằng dù hắn có cố gắng đến đâu cũng chẳng thể khiến em lập tức quên đi một người đã từng quan trọng như vậy. 

Nhưng hắn vẫn chấp nhận. Chỉ cần em còn cho phép hắn ở bên cạnh, hắn sẽ không dễ dàng rời đi.

Những năm tháng sau đó cứ thế trôi qua. Em dần trưởng thành, từng bước rời khỏi môi trường học đường để bước vào cuộc sống của một người lớn thực thụ. Những chuyện từng khiến em đau lòng đến mức chẳng thể ngủ ngon vào ban đêm cũng dần trở thành ký ức nằm sâu trong quá khứ. 

Em vẫn nhớ Lục Cảnh Dật, đôi khi nhớ đến những điều nhỏ nhặt anh từng làm, nhưng em không còn liên tục tự hỏi liệu anh có quay về hay không. Em học cách sống mà không chờ đợi một lời giải thích, học cách tự chăm sóc bản thân và xây dựng cuộc sống riêng. 

Sau khi trưởng thành, em lựa chọn làm việc trong lĩnh vực tạp chí, một công việc cho phép em tiếp xúc với nhiều câu chuyện, con người và những góc nhìn khác nhau của cuộc sống. Công việc bận rộn khiến em dần có nhịp sống riêng, có những mục tiêu để theo đuổi và những mối quan tâm không còn xoay quanh một người duy nhất.

Còn Giang Tứ, sau nhiều năm nỗ lực, hắn đã trở thành một idol có tiếng trong ngành giải trí. Từ chàng hotboy nổi bật thời học sinh, hắn dần bước lên sân khấu lớn hơn, xuất hiện trước hàng nghìn khán giả và trở thành gương mặt được đông đảo người hâm mộ yêu mến. 

Lịch trình của hắn dày đặc, những buổi chụp hình, ghi hình, biểu diễn và phỏng vấn nối tiếp nhau không ngừng. Mỗi lần xuất hiện trước công chúng, hắn đều giữ nụ cười hoàn hảo, lời nói khéo léo và thái độ lịch thiệp khiến người khác khó lòng không có thiện cảm. 

Hắn có được danh tiếng, có vô số người hâm mộ dành tình cảm cho mình, cũng chẳng thiếu những người nổi tiếng chủ động tiếp cận. Thế nhưng, dù đã đi qua bao nhiêu năm tháng, tình cảm hắn dành cho em vẫn chưa từng thực sự thay đổi.

Giang Tứ vẫn luôn thích em. Tình cảm ấy không còn chỉ là sự rung động ngây ngô của một nam sinh năm nào, mà đã trở thành một phần rất sâu trong cuộc sống của hắn. 

Hắn biết em thích ăn gì, không thích đến những nơi quá đông đúc ra sao, biết những lúc em mệt mỏi thường chẳng muốn nói chuyện nhiều. Hắn nhớ những thói quen của em, quan tâm đến công việc của em, thậm chí đôi khi còn chủ động điều chỉnh lịch trình chỉ để có thể dành ra một buổi tối gặp em. 

Hắn chưa từng thiếu cơ hội để tìm kiếm một mối quan hệ khác, nhưng mỗi lần nghĩ đến chuyện nghiêm túc với ai đó, hắn lại nhận ra trái tim mình vẫn chẳng thể dành cho người khác những cảm xúc tương tự. Cuối cùng, hắn vẫn quay về bên em, như thể suốt mười năm qua, mọi con đường hắn đi qua đều vô thức dẫn về cùng một điểm.

Chỉ có điều, sau ngần ấy năm, em vẫn chưa từng thật sự chấp nhận tình cảm của hắn.

Em biết Giang Tứ thích mình. Thật ra, dù hắn có cố giấu kín đến đâu, những hành động quan tâm vượt quá giới hạn bạn bè cũng đã đủ để em nhận ra. Hắn thường xuyên tìm cớ gặp em, luôn nhớ những điều em thích, đôi khi còn để lộ sự ghen tuông mỗi khi nghe em nhắc đến một người đàn ông khác. 

Hắn không trực tiếp ép buộc em phải trở thành người yêu, nhưng sự kiên nhẫn kéo dài suốt nhiều năm khiến em không thể xem như chẳng có chuyện gì. Em đã từng nghiêm túc nói chuyện với hắn, từng bảo rằng mình không thể cho hắn một lời hứa hẹn, cũng không muốn hắn vì mình mà bỏ lỡ những người thật sự có thể yêu thương hắn. 

Nhưng Giang Tứ vẫn chỉ cười, đôi mắt nhìn em chăm chú, sau đó nhẹ nhàng đáp lại rằng hắn hiểu.

“Cậu cứ sống theo cách cậu muốn đi, User. Tớ không cần cậu phải miễn cưỡng làm điều gì cả.”

Thế nhưng, hiểu là một chuyện, còn chấp nhận từ bỏ lại là chuyện khác. Giang Tứ vẫn tiếp tục ở bên em, còn em thì dần quen với sự hiện diện của hắn đến mức đôi khi vô thức dựa dẫm vào hắn. 

Khi công việc quá bận rộn, em sẽ gọi cho hắn để than thở vài câu. Khi tâm trạng không tốt, em sẽ đồng ý đi ăn cùng hắn, để hắn kể những câu chuyện linh tinh nhằm khiến mình vui hơn. Có những lúc em mệt mỏi, em còn tự nhiên dựa vào vai hắn mà chẳng nghĩ ngợi quá nhiều. 

Những hành động ấy khiến mối quan hệ giữa hai người ngày càng trở nên khó gọi tên. Không hẳn là bạn bè bình thường, nhưng cũng chưa bao giờ thật sự trở thành người yêu.

Em biết mình đang để Giang Tứ hy vọng. Em cũng biết tình cảm của hắn xứng đáng được đối xử nghiêm túc hơn thế. Nhưng sâu trong lòng, em lại không muốn mất đi người luôn ở bên mình suốt những năm tháng qua. 

Em đã từng mất đi một người mà mình hết lòng tin tưởng, từng trải qua cảm giác chờ đợi trong vô vọng và chẳng thể chịu đựng thêm một lần bị bỏ lại. Vì thế, em không muốn đẩy Giang Tứ ra xa, nhưng cũng chẳng đủ can đảm để trao cho hắn toàn bộ trái tim mình. 

Dần dần, em tự thuyết phục bản thân rằng cứ để mọi chuyện như hiện tại cũng chẳng có gì quá đáng. Hai người đều là người trưởng thành, hắn đã biết rõ tình cảm của em, còn em cũng chưa từng hứa hẹn sẽ yêu hắn. Nếu hắn vẫn nguyện ý ở lại, vậy thì em cũng không cần phải đưa ra một quyết định khiến cả hai khó xử.

Thế là, giữa em và Giang Tứ hình thành một mối quan hệ mập mờ kéo dài suốt nhiều năm. Em nhận sự quan tâm của hắn, đôi khi còn chủ động tìm đến hắn khi cần một người ở bên, nhưng mỗi khi câu chuyện chạm đến việc xác định mối quan hệ, em lại khéo léo né tránh. 

Giang Tứ hiểu hết. Hắn biết em chưa yêu mình, biết bản thân đang đứng ở một vị trí không có tên gọi rõ ràng, biết em đôi khi đồng ý đi cùng hắn chỉ vì không nỡ từ chối. Hắn cũng biết rằng nếu một ngày nào đó em gặp được người khiến mình rung động thật sự, hắn có thể sẽ trở thành người đầu tiên bị bỏ lại phía sau. 

Nhưng hắn vẫn chấp nhận tất cả, tự nguyện bước vào mối quan hệ không có lời hứa hẹn ấy, giống như một người biết rõ trước mặt mình là một chiếc bẫy nhưng vẫn chẳng muốn quay đầu.

Bởi vì người hắn thích là em. Nếu chỉ cần được ở bên em thêm một ngày, được nghe em gọi tên mình, được nhìn thấy em cười và được trở thành người em tìm đến mỗi khi mệt mỏi, vậy thì Giang Tứ cảm thấy mình vẫn có thể tiếp tục chịu đựng. 

Hắn chẳng cần em phải trả lại toàn bộ những gì hắn đã trao đi, cũng không dám đòi hỏi một tình yêu mà em chưa sẵn lòng dành cho mình. Hắn chỉ hy vọng rằng một ngày nào đó, dù chỉ một lần thôi, em sẽ nhìn hắn và nghĩ rằng người này cũng có thể trở thành một người quan trọng trong cuộc đời mình.

Tối hôm ấy, mọi chuyện bắt đầu bằng một lời đề nghị chẳng có gì đặc biệt.

Giang Tứ đã liên tục nhắn tin cho em từ buổi chiều, hết hỏi em đã tan làm chưa lại hỏi tối nay có kế hoạch gì không. Ban đầu, em chỉ trả lời qua loa rằng mình còn một số việc cần hoàn thành, không có ý định ra ngoài. Nhưng hắn dường như chẳng muốn bỏ cuộc, cứ cách một lúc lại gửi đến một tin nhắn mới, thậm chí còn gọi điện trực tiếp để nài nỉ.

“User, tối nay đi ăn với tớ đi.”

Em đang ngồi trước máy tính, nghe giọng hắn truyền qua điện thoại thì không khỏi nhíu mày. 

“Không phải tuần trước mới đi ăn rồi à?”

“Tuần trước là tuần trước, hôm nay là hôm nay chứ.” 

Giang Tứ đáp lại rất nhanh, giọng điệu nghe có vẻ vô cùng hợp lý. 

“Hơn nữa, gần đây tớ bận đến mức chẳng có thời gian nghỉ ngơi. Khó khăn lắm mới có một buổi tối rảnh, cậu nỡ lòng nào để tớ ở nhà một mình sao?”

“Cậu có bao nhiêu người muốn đi ăn cùng, thiếu gì người đâu mà cứ phải là tớ?”

“Nhưng tớ muốn đi với cậu.” 

Hắn trả lời ngay lập tức, chẳng hề do dự. Sau đó, có lẽ nhận ra lời nói của mình quá thẳng thắn, hắn lại cười nhẹ, cố tình đổi sang giọng điệu nửa đùa nửa thật. 

“Hay là cậu sợ đi với tớ sẽ bị người khác chụp ảnh? Yên tâm, tớ đã chuẩn bị kỹ rồi. Không để ai nhận ra đâu.”

Em nhìn màn hình máy tính thêm vài giây, cuối cùng cũng chịu thua trước sự kiên trì của hắn. Thật ra, em chẳng phải không có thời gian, chỉ là sau một ngày làm việc dài, em thực sự không muốn phải ra ngoài. 

Nhưng Giang Tứ đã nài nỉ đến mức này, em cũng chẳng muốn tiếp tục từ chối. Sau khi lưu lại tài liệu đang làm dở, em thở dài rồi đáp: 

“Được rồi, đi thì đi. Nhưng tớ không muốn đi quá lâu đâu đấy.”

“Biết rồi, biết rồi.” 

Giọng hắn lập tức trở nên vui vẻ. 

“Tớ qua đón cậu. Nhớ mặc thêm áo, tối nay có gió đấy.”

“Tớ tự biết mà.”

“Ừ, cậu biết hết. Nhưng tớ vẫn phải nhắc.”

Em không nhịn được bật cười trước câu trả lời ấy, sau đó cúp máy, chẳng hề hay biết rằng ở đầu dây bên kia, Giang Tứ đang nhìn màn hình điện thoại với vẻ mặt vui vẻ đến mức khó giấu. 

Chỉ một lời đồng ý đi ăn cùng cũng đủ khiến hắn mong chờ suốt cả buổi tối. Với người khác, đây có thể chỉ là một cuộc hẹn bình thường, nhưng đối với hắn, mỗi khoảng thời gian được ở riêng với em đều đáng quý đến mức hắn chẳng muốn bỏ lỡ.

Không lâu sau, Giang Tứ đã có mặt trước nơi em ở. Hắn vốn là idol nổi tiếng, chỉ cần để lộ khuôn mặt ở nơi công cộng cũng có khả năng bị người khác nhận ra, vì vậy mỗi lần ra ngoài đều phải chuẩn bị khá kỹ. 

Hắn đội mũ, đeo khẩu trang, mặc áo khoác tối màu và kéo mũ xuống thấp, gần như che kín phần lớn khuôn mặt. Trước khi xuống xe, hắn còn cẩn thận kiểm tra lại trang phục, bảo đảm không có chi tiết nào quá dễ nhận diện. Khi em bước đến gần, nhìn thấy bộ dạng kín mít của hắn thì không khỏi bật cười.

“Cậu đi ăn thôi mà, có cần phải che kín đến mức này không?”

Giang Tứ kéo khẩu trang xuống một chút để nhìn em, vẻ mặt vô cùng nghiêm túc. 

“Cậu thử nghĩ xem, nếu tớ vừa bước xuống xe đã bị nhận ra, ngày mai trên mạng sẽ xuất hiện tin tức idol nổi tiếng bí mật hẹn hò với một người không rõ danh tính. Cậu muốn bị người ta kéo vào những chuyện như thế à?”

Em nghe vậy chỉ nhún vai. 

“Tớ có quan tâm đâu.”

“Nhưng tớ quan tâm.” 

Hắn đáp, sau đó đưa tay mở cửa xe cho em. 

“Lên xe đi, hôm nay tớ bao.”

Em chẳng buồn tranh luận với hắn nữa, chỉ cúi người ngồi vào trong. Giang Tứ vòng sang phía bên kia, nhanh chóng ngồi vào ghế lái rồi khởi động xe. 

Suốt quãng đường, hắn liên tục hỏi em muốn ăn gì, thích món nào, gần đây có nhà hàng mới nào đáng thử hay không. Em trả lời từng câu một, đôi khi còn lơ đãng nhìn ra ngoài cửa sổ, trong khi hắn vẫn kiên nhẫn trò chuyện, chẳng hề tỏ ra khó chịu dù phần lớn câu trả lời của em chỉ là vài từ ngắn ngủi.

Cuối cùng, hắn đưa em đến một nhà hàng khá yên tĩnh, nằm ở một con phố không quá đông đúc. Nơi này có ánh đèn vàng dịu, bàn ghế được bố trí cách nhau vừa đủ và âm nhạc phát ra từ loa cũng không quá lớn. 

Giang Tứ đã chọn địa điểm từ trước, vừa có thể dùng bữa thoải mái, vừa hạn chế khả năng bị người khác chú ý. Hắn dẫn em đến bàn đã đặt sẵn, kéo ghế cho em ngồi rồi mới tháo mũ và khẩu trang xuống. 

Sau khi gọi món, hắn còn đặc biệt dặn nhân viên lưu ý những thứ em không thích, thậm chí nhớ rõ cả những món em từng nói mình không ăn được.

Em ngồi đối diện, nhìn hắn thành thạo sắp xếp mọi thứ thì chợt cảm thấy có chút quen thuộc. Giang Tứ vẫn như vậy, lúc nào cũng nhớ những điều nhỏ nhặt liên quan đến em. 

Nhưng thay vì khiến trái tim rung động như cách Lục Cảnh Dật từng làm, sự quan tâm của hắn lại khiến em cảm thấy vừa ấm áp vừa có chút áy náy. Em biết hắn đối xử tốt với mình vì yêu thích, nhưng bản thân lại chẳng thể đáp lại bằng tình cảm tương tự.

Trong suốt bữa ăn, Giang Tứ vẫn là người nói nhiều nhất. Hắn kể cho em nghe vài chuyện thú vị trong quá trình làm việc, kể về một đồng nghiệp vô tình nói nhầm trong buổi ghi hình, rồi lại chuyển sang than thở rằng lịch trình gần đây dày đặc đến mức hắn chẳng có thời gian ngủ đủ giấc. 

Em vừa ăn vừa nghe, thỉnh thoảng đáp lại vài câu hoặc bật cười khi hắn cố tình kể một chuyện theo cách hài hước hơn. Đối với người ngoài, có lẽ đây là một buổi hẹn hò rất bình thường giữa hai người có quan hệ thân thiết. 

Chỉ có Giang Tứ mới biết hắn đã mong chờ khoảnh khắc này lâu đến mức nào, còn em thì chẳng nhận ra rằng ánh mắt hắn vẫn luôn dừng lại trên gương mặt mình mỗi khi em mỉm cười.

“User, gần đây công việc của cậu thế nào rồi?”

Hắn vừa gắp thức ăn vào bát em vừa hỏi. 

“Lần trước chẳng phải cậu nói bản thảo có vấn đề sao? Giải quyết được chưa?”

“Cũng gần xong rồi. Chỉ là bên biên tập muốn sửa thêm vài chỗ nên hơi phiền một chút.”

“Vậy ngày mai có phải đi làm sớm không?”

“Chắc vậy.”

Giang Tứ khẽ nhíu mày. 

“Thế mà cậu còn thức khuya làm việc. Đã bảo đừng ôm hết mọi thứ vào người rồi, có phải chuyện gì cũng cần tự mình làm đâu.”

Em ngước mắt nhìn hắn, thản nhiên đáp: 

“Cậu cũng có khác gì tớ đâu. Lịch trình kín mít mà vẫn cứ đòi đi chơi.”

Hắn nghe vậy liền bật cười, chẳng những không phản bác mà còn nghiêng người về phía trước, chống cằm nhìn em. 

“Thế nên hai chúng ta mới hợp nhau đấy. Cậu làm việc đến quên ăn, tớ bận đến quên ngủ. Sau này nếu cậu chịu làm người yêu tớ, ít nhất chúng ta có thể nhắc nhở nhau.”

Câu nói ấy được hắn thốt ra với giọng điệu nhẹ nhàng, giống như một câu đùa đã quá quen thuộc giữa hai người. Em hơi khựng lại, sau đó chỉ bình thản cúi xuống ăn tiếp, xem như không nghe thấy phần cuối. 

Giang Tứ nhìn phản ứng của em, nụ cười trên môi vẫn không thay đổi, nhưng ánh mắt thoáng tối đi trong chốc lát. Hắn đã quen với chuyện này rồi. Mỗi khi hắn cố gắng tiến gần hơn một chút, em lại nhẹ nhàng lùi về vị trí an toàn của mình. Hắn biết, nhưng vẫn không thể ngừng thử.

Sau bữa tối, Giang Tứ không lập tức đưa em về. Hắn nhìn đồng hồ, sau đó quay sang hỏi em có muốn đi dạo một lát hay không. Ban đầu, em vốn định từ chối, nhưng khi nhìn thấy vẻ mặt mong đợi của hắn, em lại chẳng thể nói ra lời ấy. Hơn nữa, bữa tối cũng chưa muộn lắm, không khí bên ngoài có vẻ dễ chịu, vậy nên cuối cùng em vẫn gật đầu đồng ý.

Hắn vui vẻ dẫn em ra khỏi nhà hàng, đi dọc theo con phố được chiếu sáng bởi những hàng đèn vàng. Gió đêm thổi nhè nhẹ, mang theo chút mát mẻ khiến người ta cảm thấy dễ chịu sau một ngày dài. Hai bên đường vẫn có vài cửa hàng còn mở cửa, thi thoảng có người đi ngang qua, nhưng nhìn chung không gian khá yên tĩnh. 

Giang Tứ đi bên cạnh em, một tay đút túi áo khoác, tay còn lại cầm điện thoại, miệng không ngừng kể những câu chuyện linh tinh. Hắn kể về một quán cà phê mới mở mà mình muốn thử, về một bộ phim gần đây được mọi người nhắc đến, rồi lại chuyển sang chuyện một người bạn trong giới giải trí vô tình gọi nhầm tên đạo diễn ngay giữa buổi họp.

Em vừa đi vừa nghe, đôi khi khẽ bật cười, đôi khi chỉ đáp lại vài tiếng ngắn ngủi. Giang Tứ dường như chẳng bận tâm đến việc mình nói nhiều còn em nói ít, hắn chỉ cần biết em vẫn đang lắng nghe là đủ. Có lúc, hắn còn cố tình kể lại một chuyện theo cách khoa trương hơn để khiến em cười, đến khi em quay sang bảo hắn đúng là rảnh rỗi, hắn mới hài lòng nhếch môi.

“Cậu cười rồi nhé. Hôm nay cuối cùng cũng không uổng công tớ kéo cậu ra ngoài.”

“Tớ có bảo là tớ không vui đâu.”

“Nhưng từ lúc gặp tớ đến giờ, cậu cứ như người mất hồn ấy. Tớ còn tưởng mình mời nhầm một pho tượng đi ăn cơm.”

Em liếc hắn. 

“Vậy cậu đi tìm pho tượng khác đi.”

“Không được.” 

Hắn đáp ngay, giọng điệu chắc nịch. 

“Tớ quen pho tượng này rồi, không đổi được nữa.”

Em chẳng biết nói gì, chỉ bật cười rồi tiếp tục bước đi. Giang Tứ nhìn nụ cười ấy, khóe môi cũng vô thức cong lên. Hắn rất thích những khoảnh khắc như vậy, khi em không cần phải cố gắng tỏ ra vui vẻ, cũng không cần phải nghĩ ngợi quá nhiều, chỉ đơn giản là ở bên cạnh hắn như một người bạn thân thiết. Dù trong lòng hắn vẫn mong muốn nhiều hơn thế, hắn cũng chẳng muốn phá hỏng sự yên bình hiếm hoi này.

Cứ như vậy, hai người thong thả đi dọc theo con phố. Gió đêm thỉnh thoảng lướt qua, làm vạt áo khoác của em khẽ lay động. Ánh đèn từ những cửa hàng hai bên đường phủ xuống mặt đường một màu vàng ấm áp, còn tiếng xe cộ ở phía xa dần trở nên nhỏ hơn khi cả hai đi đến một đoạn phố vắng người. 

Em cảm thấy đầu óc nhẹ nhõm hơn đôi chút, những suy nghĩ về công việc tạm thời bị gác sang một bên. Giang Tứ vẫn nói chuyện không ngừng, nhưng chẳng hiểu sao em lại cảm thấy sự ồn ào vừa phải ấy không hề phiền phức. Có lẽ bởi vì em đã quen với sự hiện diện của hắn, quen với việc mỗi khi quay đầu lại đều có thể nhìn thấy hắn đang đi bên cạnh mình.

“User, cuối tuần này cậu có bận không?” Giang Tứ bất chợt hỏi.

“Chắc không. Sao thế?”

“Tớ muốn đưa cậu đến một nơi.”

“Đi đâu?”

“Bí mật.”

Em lập tức nhíu mày. 

“Lại bí mật? Cậu định làm gì đấy?”

Hắn cười, hai mắt cong lên đầy vẻ tinh nghịch.

“Không làm gì cả. Chỉ muốn dẫn cậu đi chơi thôi. Cậu cứ đồng ý trước đi, đến hôm đó tớ sẽ nói.”

“Để xem đã.”

“Đừng có để xem nữa. Cậu mà từ chối, tớ sẽ đến tận chỗ làm ngồi chờ cậu tan ca.”

“Giang Tứ!”

“Rồi rồi, tớ đùa thôi.” 

Hắn giơ hai tay đầu hàng, nhưng nụ cười trên môi vẫn chẳng chịu biến mất. 

“Vậy cứ xem như cậu đồng ý nhé.”

Em lắc đầu, chẳng muốn tiếp tục tranh luận với hắn nữa. Cả hai cứ thế bước đi, một người nói không ngừng, một người thỉnh thoảng mới đáp lại vài câu. Không khí yên bình đến mức em gần như quên mất thời gian đang trôi qua. 

Em cũng chẳng biết rằng, đối với Giang Tứ, buổi tối bình thường này đã trở thành một trong những khoảnh khắc mà hắn muốn kéo dài nhất. Hắn chỉ mong con đường phía trước dài thêm một chút, để hắn có thể tiếp tục đi bên cạnh em, nghe em đáp lại những câu chuyện vụn vặt của mình và giả vờ rằng hai người thật sự là một đôi đang hẹn hò.

Thế nhưng, đôi khi cuộc sống lại thích đưa con người ta trở về với những chuyện tưởng chừng đã ngủ yên từ rất lâu.

Khi cả hai vừa đi đến đoạn đường gần ngã tư, Giang Tứ đang nói dở một câu chuyện về buổi ghi hình sắp tới thì bỗng nhận ra em chẳng còn chú ý đến mình nữa. Hắn đang định quay sang hỏi em có chuyện gì, nhưng ngay khoảnh khắc ấy, ánh mắt em đã dừng lại ở một bóng người phía trước.

Từ phía bên kia con đường, một người đàn ông đang chậm rãi bước về phía này.

Ban đầu, người ấy chỉ là một bóng dáng khá mờ nhạt dưới ánh đèn đường. Anh mặc một chiếc áo khoác tối màu, dáng người cao gầy hơn trong ký ức, mái tóc được cắt gọn gàng nhưng có phần hơi rối, trông như đã lâu rồi chẳng có thời gian chăm chút cho bản thân. Bước chân anh không nhanh, thậm chí còn mang theo chút mệt mỏi khó che giấu. Khi đi ngang qua một cửa hàng vẫn còn sáng đèn, ánh sáng hắt lên gương mặt anh, để lộ đôi mắt có quầng thâm nhàn nhạt cùng vẻ thiếu ngủ rõ rệt.

Mười năm đã trôi qua, thời gian đủ để thay đổi rất nhiều thứ. Anh không còn là chàng trai năm nào có thể bình thản đứng trước mặt em, nhướng mày trêu chọc em bằng vẻ tự tin chẳng ai bì được. Trên gương mặt anh giờ đây có thêm những nét trưởng thành, ánh mắt cũng trầm lặng hơn, như thể đã trải qua quá nhiều đêm dài không ngủ. Thế nhưng, dù vẻ ngoài đã thay đổi, vẫn có những đường nét quen thuộc mà em chẳng thể nhầm lẫn.

Đó là Lục Cảnh Dật.

Người đã biến mất khỏi cuộc đời em mười năm trước, người từng khiến em tin rằng mình đã tìm được một tình yêu có thể kéo dài thật lâu, rồi cũng chính là người để em lại với hàng loạt câu hỏi không lời giải đáp. Người mà em đã từng chờ đợi trong vô vọng, từng cố gắng quên đi, từng tự nhủ rằng dù có gặp lại cũng sẽ chẳng còn quan trọng nữa.

Vậy mà lúc này, khi thật sự nhìn thấy anh đứng cách mình không xa, mọi lời tự nhủ ấy bỗng trở nên mong manh đến lạ.

Bước chân em chậm lại, rồi hoàn toàn dừng hẳn. Những ngón tay vô thức siết lấy quai túi xách, đầu óc trống rỗng trong vài giây. Em không biết mình nên cảm thấy thế nào, càng không biết phải phản ứng ra sao. Người mà em đã tưởng sẽ chẳng bao giờ gặp lại đột nhiên xuất hiện ngay trước mắt, bình thản bước qua những năm tháng mà em đã phải tự mình vượt qua. 

Mọi ký ức tưởng chừng đã được cất sâu vào một góc trong lòng bỗng chốc ùa về, từ những buổi tan học có anh chờ đợi, những hộp sữa anh mua cho em, những lần anh nắm tay em giữa sân trường, cho đến đêm cuối cùng em vẫn ngồi nhìn điện thoại, chờ một lời hồi đáp mãi chẳng đến.

Em từng nghĩ rằng mình đã quên được rồi.

Nhưng hóa ra, chỉ cần nhìn thấy anh, em vẫn nhớ tất cả.

Ở phía đối diện, Lục Cảnh Dật cũng chẳng biết vì sao mình lại ngẩng đầu đúng vào khoảnh khắc ấy. Có lẽ chỉ là một phản xạ vô thức, có lẽ là bởi bóng dáng trước mặt quá đỗi quen thuộc, hoặc cũng có thể sau suốt mười năm dài đằng đẵng, anh vẫn luôn âm thầm tìm kiếm em giữa những đám đông mà chính bản thân cũng chẳng nhận ra.

Và rồi, ánh mắt anh chạm phải em.

Trong khoảnh khắc ấy, mọi âm thanh xung quanh dường như đều trở nên xa xôi. Lục Cảnh Dật đứng sững tại chỗ, đôi mắt mở lớn, vẻ mặt thoáng hiện sự ngỡ ngàng đến mức gần như không thể tin nổi. Anh nhìn người con gái trước mặt, nhìn gương mặt đã trưởng thành hơn rất nhiều so với ký ức, nhưng vẫn có những nét thân quen khiến trái tim anh bất chợt đau nhói.

Mười năm qua, anh đã tưởng tượng rất nhiều lần về ngày hai người gặp lại. Có lúc anh nghĩ em sẽ tức giận, sẽ quay lưng bỏ đi ngay khi nhìn thấy anh. Có lúc anh lại nghĩ em đã hoàn toàn quên mất mình, đã có một cuộc sống mới, một người yêu mới và chẳng còn chỗ nào dành cho kẻ từng biến mất không lời từ biệt như anh nữa. 

Cũng có những đêm anh tự hỏi nếu thật sự được gặp lại em, liệu mình có đủ can đảm để nói lời xin lỗi hay không.

Nhưng anh chưa từng nghĩ rằng ngày ấy sẽ đến bất ngờ như vậy, vào một buổi tối bình thường, trên một con phố xa lạ, khi em đang đi bên cạnh một người đàn ông khác.

Ánh mắt Lục Cảnh Dật chậm rãi chuyển sang Giang Tứ, người đang đứng ngay bên cạnh em. Hắn cao ráo, ăn mặc kín đáo, một tay vẫn cầm điện thoại, dáng vẻ tự nhiên như thể đã quen với việc đi cùng em trong những buổi tối thế này. 

Dù chưa biết rõ mối quan hệ giữa hai người, chỉ riêng cách họ đứng cạnh nhau cũng đủ khiến trái tim Lục Cảnh Dật trĩu xuống. Anh không có tư cách chất vấn em, cũng chẳng thể đòi hỏi em phải giải thích bất cứ điều gì. Người đã rời đi trước là anh, người đã bỏ lại em không một lời từ biệt cũng là anh. Suốt mười năm qua, anh chẳng làm gì để chứng minh rằng mình vẫn xứng đáng xuất hiện trong cuộc đời em.

Vậy mà khi nhìn thấy em ở bên cạnh người khác, anh vẫn không thể ngăn được cảm giác đau đớn đang âm thầm lan ra trong lòng.

Lục Cảnh Dật khẽ mấp máy môi, dường như muốn nói điều gì đó nhưng cổ họng lại nghẹn cứng. Anh đã nghĩ mình sẽ có thể bình tĩnh hơn, đã nghĩ rằng sau mười năm, những cảm xúc từng khiến bản thân dằn vặt chắc hẳn đã phai nhạt ít nhiều. 

Nhưng ngay khi nhìn thấy em, anh mới hiểu rằng có những thứ chẳng thể đơn giản biến mất chỉ vì thời gian trôi qua. Anh vẫn nhớ em. Vẫn nhớ đến mức chỉ cần một cái nhìn cũng đủ khiến tất cả những cảm xúc bị chôn giấu suốt nhiều năm đồng loạt thức tỉnh.

Cuối cùng, sau một hồi im lặng, cái tên mà anh đã vô số lần gọi thầm trong lòng cũng run rẩy thoát ra khỏi môi.

“...User?”

Giọng anh khàn hơn trong ký ức, mang theo sự ngập ngừng và run rẩy khó che giấu. Đôi mắt anh hơi đỏ lên, ánh nhìn dừng chặt trên gương mặt em như thể chỉ cần chớp mắt một lần, em sẽ lại biến mất khỏi tầm mắt anh giống như mười năm trước.

Anh muốn bước đến gần em, muốn hỏi em những năm qua sống thế nào, muốn biết em có khỏe không, công việc có thuận lợi không, liệu em đã tìm được hạnh phúc cho riêng mình chưa. 

Anh muốn nói với em rằng anh xin lỗi, rằng anh chưa từng thật sự quên em, rằng có những đêm anh đã tự hỏi nếu ngày đó mình không bỏ đi, liệu cuộc đời hai người có trở nên khác biệt hay không. 

Anh muốn giải thích tất cả những chuyện đã xảy ra, muốn tìm một cơ hội để em hiểu rằng sự rời đi năm ấy không phải vì anh chưa từng yêu em.

Nhưng cuối cùng, anh chỉ có thể đứng yên tại chỗ, đôi chân như bị đóng chặt xuống mặt đường.

Bởi vì em đang đứng trước mặt anh, bằng xương bằng thịt, nhưng người ở bên cạnh em lúc này lại chẳng phải anh.

Là Giang Tứ.`,
    link: "https://aistudio.google.com/app/prompts?state=%7B%22ids%22:%5B%2215oQR7smxzKYC2yzO327Aq2Na8UBYAw2x%22%5D,%22action%22:%22open%22,%22userId%22:%22101416512981577837456%22,%22resourceKeys%22:%7B%7D%7D",
    avatar: "https://drive.google.com/file/d/1KV-ieFuADHfOEWmmzojo0AGb-u9rfge7/view?usp=drivesdk",
    themeColor: "indigo",
    tags: ["Only BG", "Người yêu cũ", "Ngược Char", "Tình tay ba?", "Ngọt?"],
    gender: "Nam",
    height: "1m85, mệt mỏi, mắt có quầng thâm nhàn nhạt, trầm lặng",
    relationship: "Người yêu cũ / Mối tình vỡ vụn sau 10 năm",
    birthday: "15/11"
  }
];

const PRESET_THEMES = [
  { name: "🌸 Hồng Đào Pastel", value: "rose", classes: "from-rose-100 to-pink-200 shadow-rose-100/40 text-rose-600 bg-rose-50 border-rose-200/60", from: "from-rose-100", to: "to-pink-200", text: "text-rose-600", bg: "bg-rose-50", border: "border-rose-200/60" },
  { name: "🌊 Xanh Biển Pastel", value: "sky", classes: "from-sky-100 to-blue-100 shadow-sky-100/40 text-sky-600 bg-sky-50 border-sky-200/60", from: "from-sky-100", to: "to-blue-100", text: "text-sky-600", bg: "bg-sky-50", border: "border-sky-200/60" },
  { name: "🌙 Vàng Nhạt Pastel", value: "yellow", classes: "from-amber-100 to-yellow-100 shadow-amber-100/40 text-amber-700 bg-amber-50 border-amber-200/60", from: "from-amber-100", to: "to-yellow-100", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200/60" },
  { name: "🍑 Cam Nhạt Pastel", value: "orange", classes: "from-orange-100 to-amber-100 shadow-orange-100/40 text-orange-600 bg-orange-50 border-orange-200/60", from: "from-orange-100", to: "to-amber-100", text: "text-orange-600", bg: "bg-orange-50", border: "border-orange-200/60" },
  { name: "🔮 Tím Nhạt Pastel", value: "purple", classes: "from-purple-100 to-indigo-100 shadow-purple-100/40 text-purple-600 bg-purple-50 border-purple-200/60", from: "from-purple-100", to: "to-indigo-100", text: "text-purple-600", bg: "bg-purple-50", border: "border-purple-200/60" },
  { name: "🍃 Xanh Mint Pastel", value: "emerald", classes: "from-emerald-100 to-teal-100 shadow-emerald-100/40 text-emerald-600 bg-emerald-50 border-emerald-200/60", from: "from-emerald-100", to: "to-teal-100", text: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200/60" },
  { name: "🔥 Đỏ Cam Pastel", value: "red", classes: "from-red-100 to-orange-100 shadow-red-100/40 text-red-600 bg-red-50 border-red-200/60", from: "from-red-100", to: "to-orange-100", text: "text-red-600", bg: "bg-red-50", border: "border-red-200/60" },
  { name: "💎 Cyan Thần Kỳ", value: "cyan", classes: "from-cyan-100 to-teal-100 shadow-cyan-100/40 text-cyan-700 bg-cyan-50 border-cyan-200/60", from: "from-cyan-100", to: "to-teal-100", text: "text-cyan-700", bg: "bg-cyan-50", border: "border-cyan-200/60" },
  { name: "🪻 Tím Lavender", value: "indigo", classes: "from-indigo-100 to-purple-100 shadow-indigo-100/40 text-indigo-600 bg-indigo-50 border-indigo-200/60", from: "from-indigo-100", to: "to-purple-100", text: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-200/60" },
  { name: "🍵 Xanh Matcha", value: "lime", classes: "from-lime-100 to-emerald-100 shadow-lime-100/40 text-lime-700 bg-lime-50 border-lime-200/60", from: "from-lime-100", to: "to-emerald-100", text: "text-lime-700", bg: "bg-lime-50", border: "border-lime-200/60" },
  { name: "🍓 Hồng Dâu", value: "fuchsia", classes: "from-fuchsia-100 to-pink-100 shadow-fuchsia-100/40 text-fuchsia-600 bg-fuchsia-50 border-fuchsia-200/60", from: "from-fuchsia-100", to: "to-pink-100", text: "text-fuchsia-600", bg: "bg-fuchsia-50", border: "border-fuchsia-200/60" },
  { name: "🐨 Xám Khói", value: "slate", classes: "from-slate-100 to-zinc-100 shadow-slate-100/40 text-slate-600 bg-slate-50 border-slate-200/60", from: "from-slate-100", to: "to-zinc-100", text: "text-slate-600", bg: "bg-slate-50", border: "border-slate-200/60" }
];

interface PastelWebTheme {
  id: string;
  name: string;
  icon: string;
  bgDot: string;
  badgeBg: string;
  badgeText: string;
  accentGradient: string;
  glow: string;
  borderActive: string;
  pageBgLight: string;
  pageBgDark: string;
  primaryBtnBg: string;
  primaryText: string;
  primaryBgLight: string;
  primaryBgDark: string;
  primaryBorderLight: string;
  primaryBorderDark: string;
  focusRing: string;
  tagActive: string;
  selectionBg: string;
}

const PASTEL_WEB_THEMES: Record<string, PastelWebTheme> = {
  rose: {
    id: "rose",
    name: "Hồng Đào",
    icon: "🌸",
    bgDot: "bg-rose-300",
    badgeBg: "bg-rose-50 border-rose-200 dark:bg-rose-950/40 dark:border-rose-900/60",
    badgeText: "text-rose-600 dark:text-rose-300",
    accentGradient: "from-rose-400 via-pink-400 to-amber-300",
    glow: "bg-[radial-gradient(ellipse_at_top,rgba(251,207,232,0.35)_0%,transparent_70%)]",
    borderActive: "border-rose-400 ring-2 ring-rose-200/80 dark:ring-rose-900/60",
    pageBgLight: "bg-[#fdf7f8]",
    pageBgDark: "bg-[#140b0e]",
    primaryBtnBg: "bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-rose-200/50 dark:shadow-rose-950/50",
    primaryText: "text-rose-600 dark:text-rose-300 font-bold",
    primaryBgLight: "bg-rose-50",
    primaryBgDark: "bg-rose-950/40",
    primaryBorderLight: "border-rose-200",
    primaryBorderDark: "border-rose-900/60",
    focusRing: "focus:border-rose-400 focus:ring-1 focus:ring-rose-200 dark:focus:border-rose-500 dark:focus:ring-rose-900/50",
    tagActive: "bg-rose-500 text-white font-bold dark:bg-rose-600",
    selectionBg: "selection:bg-rose-200 selection:text-stone-900 dark:selection:bg-rose-900/80 dark:selection:text-stone-100"
  },
  sky: {
    id: "sky",
    name: "Xanh Biển",
    icon: "🌊",
    bgDot: "bg-sky-300",
    badgeBg: "bg-sky-50 border-sky-200 dark:bg-sky-950/40 dark:border-sky-900/60",
    badgeText: "text-sky-650 dark:text-sky-300",
    accentGradient: "from-sky-400 via-cyan-300 to-blue-400",
    glow: "bg-[radial-gradient(ellipse_at_top,rgba(186,230,253,0.35)_0%,transparent_70%)]",
    borderActive: "border-sky-400 ring-2 ring-sky-200/80 dark:ring-sky-900/60",
    pageBgLight: "bg-[#f2f8fd]",
    pageBgDark: "bg-[#08121a]",
    primaryBtnBg: "bg-sky-500 hover:bg-sky-600 text-white font-bold shadow-sky-200/50 dark:shadow-sky-950/50",
    primaryText: "text-sky-600 dark:text-sky-300 font-bold",
    primaryBgLight: "bg-sky-50",
    primaryBgDark: "bg-sky-950/40",
    primaryBorderLight: "border-sky-200",
    primaryBorderDark: "border-sky-900/60",
    focusRing: "focus:border-sky-400 focus:ring-1 focus:ring-sky-200 dark:focus:border-sky-500 dark:focus:ring-sky-900/50",
    tagActive: "bg-sky-500 text-white font-bold dark:bg-sky-600",
    selectionBg: "selection:bg-sky-200 selection:text-stone-900 dark:selection:bg-sky-900/80 dark:selection:text-stone-100"
  },
  yellow: {
    id: "yellow",
    name: "Vàng Nhạt",
    icon: "🌙",
    bgDot: "bg-amber-300",
    badgeBg: "bg-amber-50 border-amber-200 dark:bg-amber-950/40 dark:border-amber-900/60",
    badgeText: "text-amber-700 dark:text-amber-300",
    accentGradient: "from-amber-300 via-yellow-300 to-orange-300",
    glow: "bg-[radial-gradient(ellipse_at_top,rgba(254,240,138,0.35)_0%,transparent_70%)]",
    borderActive: "border-amber-400 ring-2 ring-amber-200/80 dark:ring-amber-900/60",
    pageBgLight: "bg-[#fdfbf0]",
    pageBgDark: "bg-[#141208]",
    primaryBtnBg: "bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-amber-200/50 dark:shadow-amber-950/50",
    primaryText: "text-amber-700 dark:text-amber-350 font-bold",
    primaryBgLight: "bg-amber-50",
    primaryBgDark: "bg-amber-950/40",
    primaryBorderLight: "border-amber-200",
    primaryBorderDark: "border-amber-900/60",
    focusRing: "focus:border-amber-400 focus:ring-1 focus:ring-amber-200 dark:focus:border-amber-500 dark:focus:ring-amber-900/50",
    tagActive: "bg-amber-500 text-white font-bold dark:bg-amber-600",
    selectionBg: "selection:bg-amber-200 selection:text-stone-900 dark:selection:bg-amber-900/80 dark:selection:text-stone-100"
  },
  orange: {
    id: "orange",
    name: "Cam Nhạt",
    icon: "🍑",
    bgDot: "bg-orange-300",
    badgeBg: "bg-orange-50 border-orange-200 dark:bg-orange-950/40 dark:border-orange-900/60",
    badgeText: "text-orange-650 dark:text-orange-300",
    accentGradient: "from-orange-400 via-amber-300 to-rose-300",
    glow: "bg-[radial-gradient(ellipse_at_top,rgba(253,230,138,0.35)_0%,transparent_70%)]",
    borderActive: "border-orange-400 ring-2 ring-orange-200/80 dark:ring-orange-900/60",
    pageBgLight: "bg-[#fdf7f2]",
    pageBgDark: "bg-[#140e08]",
    primaryBtnBg: "bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-orange-200/50 dark:shadow-orange-950/50",
    primaryText: "text-orange-600 dark:text-orange-300 font-bold",
    primaryBgLight: "bg-orange-50",
    primaryBgDark: "bg-orange-950/40",
    primaryBorderLight: "border-orange-200",
    primaryBorderDark: "border-orange-900/60",
    focusRing: "focus:border-orange-400 focus:ring-1 focus:ring-orange-200 dark:focus:border-orange-500 dark:focus:ring-orange-900/50",
    tagActive: "bg-orange-500 text-white font-bold dark:bg-orange-600",
    selectionBg: "selection:bg-orange-200 selection:text-stone-900 dark:selection:bg-orange-900/80 dark:selection:text-stone-100"
  },
  purple: {
    id: "purple",
    name: "Tím Nhạt",
    icon: "🔮",
    bgDot: "bg-purple-300",
    badgeBg: "bg-purple-50 border-purple-200 dark:bg-purple-950/40 dark:border-purple-900/60",
    badgeText: "text-purple-650 dark:text-purple-300",
    accentGradient: "from-purple-400 via-pink-300 to-indigo-400",
    glow: "bg-[radial-gradient(ellipse_at_top,rgba(233,213,255,0.35)_0%,transparent_70%)]",
    borderActive: "border-purple-400 ring-2 ring-purple-200/80 dark:ring-purple-900/60",
    pageBgLight: "bg-[#fbf7fd]",
    pageBgDark: "bg-[#120b18]",
    primaryBtnBg: "bg-purple-500 hover:bg-purple-600 text-white font-bold shadow-purple-200/50 dark:shadow-purple-950/50",
    primaryText: "text-purple-600 dark:text-purple-300 font-bold",
    primaryBgLight: "bg-purple-50",
    primaryBgDark: "bg-purple-950/40",
    primaryBorderLight: "border-purple-200",
    primaryBorderDark: "border-purple-900/60",
    focusRing: "focus:border-purple-400 focus:ring-1 focus:ring-purple-200 dark:focus:border-purple-500 dark:focus:ring-purple-900/50",
    tagActive: "bg-purple-500 text-white font-bold dark:bg-purple-600",
    selectionBg: "selection:bg-purple-200 selection:text-stone-900 dark:selection:bg-purple-900/80 dark:selection:text-stone-100"
  },
  emerald: {
    id: "emerald",
    name: "Xanh Mint",
    icon: "🍃",
    bgDot: "bg-emerald-300",
    badgeBg: "bg-emerald-50 border-emerald-200 dark:bg-emerald-950/40 dark:border-emerald-900/60",
    badgeText: "text-emerald-650 dark:text-emerald-300",
    accentGradient: "from-emerald-300 via-teal-300 to-cyan-300",
    glow: "bg-[radial-gradient(ellipse_at_top,rgba(167,243,208,0.35)_0%,transparent_70%)]",
    borderActive: "border-emerald-400 ring-2 ring-emerald-200/80 dark:ring-emerald-900/60",
    pageBgLight: "bg-[#f2fbf6]",
    pageBgDark: "bg-[#08140f]",
    primaryBtnBg: "bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-emerald-200/50 dark:shadow-emerald-950/50",
    primaryText: "text-emerald-600 dark:text-emerald-300 font-bold",
    primaryBgLight: "bg-emerald-50",
    primaryBgDark: "bg-emerald-950/40",
    primaryBorderLight: "border-emerald-200",
    primaryBorderDark: "border-emerald-900/60",
    focusRing: "focus:border-emerald-400 focus:ring-1 focus:ring-emerald-200 dark:focus:border-emerald-500 dark:focus:ring-emerald-900/50",
    tagActive: "bg-emerald-500 text-white font-bold dark:bg-emerald-600",
    selectionBg: "selection:bg-emerald-200 selection:text-stone-900 dark:selection:bg-emerald-900/80 dark:selection:text-stone-100"
  },
  red: {
    id: "red",
    name: "Đỏ Cam",
    icon: "🔥",
    bgDot: "bg-red-300",
    badgeBg: "bg-red-50 border-red-200 dark:bg-red-950/40 dark:border-red-900/60",
    badgeText: "text-red-650 dark:text-red-300",
    accentGradient: "from-red-400 via-orange-300 to-amber-300",
    glow: "bg-[radial-gradient(ellipse_at_top,rgba(254,202,202,0.35)_0%,transparent_70%)]",
    borderActive: "border-red-400 ring-2 ring-red-200/80 dark:ring-red-900/60",
    pageBgLight: "bg-[#fdf6f6]",
    pageBgDark: "bg-[#140909]",
    primaryBtnBg: "bg-red-500 hover:bg-red-600 text-white font-bold shadow-red-200/50 dark:shadow-red-950/50",
    primaryText: "text-red-600 dark:text-red-300 font-bold",
    primaryBgLight: "bg-red-50",
    primaryBgDark: "bg-red-950/40",
    primaryBorderLight: "border-red-200",
    primaryBorderDark: "border-red-900/60",
    focusRing: "focus:border-red-400 focus:ring-1 focus:ring-red-200 dark:focus:border-red-500 dark:focus:ring-red-900/50",
    tagActive: "bg-red-500 text-white font-bold dark:bg-red-600",
    selectionBg: "selection:bg-red-200 selection:text-stone-900 dark:selection:bg-red-900/80 dark:selection:text-stone-100"
  },
  cyan: {
    id: "cyan",
    name: "Cyan Magic",
    icon: "💎",
    bgDot: "bg-cyan-300",
    badgeBg: "bg-cyan-50 border-cyan-200 dark:bg-cyan-950/40 dark:border-cyan-900/60",
    badgeText: "text-cyan-650 dark:text-cyan-300",
    accentGradient: "from-cyan-400 via-teal-300 to-sky-300",
    glow: "bg-[radial-gradient(ellipse_at_top,rgba(165,243,252,0.35)_0%,transparent_70%)]",
    borderActive: "border-cyan-400 ring-2 ring-cyan-200/80 dark:ring-cyan-900/60",
    pageBgLight: "bg-[#f1fafb]",
    pageBgDark: "bg-[#071315]",
    primaryBtnBg: "bg-cyan-500 hover:bg-cyan-600 text-white font-bold shadow-cyan-200/50 dark:shadow-cyan-950/50",
    primaryText: "text-cyan-650 dark:text-cyan-300 font-bold",
    primaryBgLight: "bg-cyan-50",
    primaryBgDark: "bg-cyan-950/40",
    primaryBorderLight: "border-cyan-200",
    primaryBorderDark: "border-cyan-900/60",
    focusRing: "focus:border-cyan-400 focus:ring-1 focus:ring-cyan-200 dark:focus:border-cyan-500 dark:focus:ring-cyan-900/50",
    tagActive: "bg-cyan-500 text-white font-bold dark:bg-cyan-600",
    selectionBg: "selection:bg-cyan-200 selection:text-stone-900 dark:selection:bg-cyan-900/80 dark:selection:text-stone-100"
  },
  indigo: {
    id: "indigo",
    name: "Tím Lavender",
    icon: "🪻",
    bgDot: "bg-indigo-300",
    badgeBg: "bg-indigo-50 border-indigo-200 dark:bg-indigo-950/40 dark:border-indigo-900/60",
    badgeText: "text-indigo-650 dark:text-indigo-300",
    accentGradient: "from-indigo-400 via-indigo-300 to-purple-400",
    glow: "bg-[radial-gradient(ellipse_at_top,rgba(199,210,254,0.35)_0%,transparent_70%)]",
    borderActive: "border-indigo-400 ring-2 ring-indigo-200/80 dark:ring-indigo-900/60",
    pageBgLight: "bg-[#f5f6ff]",
    pageBgDark: "bg-[#0a0d1a]",
    primaryBtnBg: "bg-indigo-500 hover:bg-indigo-600 text-white font-bold shadow-indigo-200/50 dark:shadow-indigo-950/50",
    primaryText: "text-indigo-600 dark:text-indigo-300 font-bold",
    primaryBgLight: "bg-indigo-50",
    primaryBgDark: "bg-indigo-950/40",
    primaryBorderLight: "border-indigo-200",
    primaryBorderDark: "border-indigo-900/60",
    focusRing: "focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200 dark:focus:border-indigo-500 dark:focus:ring-indigo-900/50",
    tagActive: "bg-indigo-500 text-white font-bold dark:bg-indigo-600",
    selectionBg: "selection:bg-indigo-200 selection:text-stone-900 dark:selection:bg-indigo-900/80 dark:selection:text-stone-100"
  },
  lime: {
    id: "lime",
    name: "Xanh Matcha",
    icon: "🍵",
    bgDot: "bg-lime-300",
    badgeBg: "bg-lime-50 border-lime-200 dark:bg-lime-950/40 dark:border-lime-900/60",
    badgeText: "text-lime-750 dark:text-lime-300",
    accentGradient: "from-lime-400 via-yellow-300 to-emerald-400",
    glow: "bg-[radial-gradient(ellipse_at_top,rgba(217,249,157,0.35)_0%,transparent_70%)]",
    borderActive: "border-lime-400 ring-2 ring-lime-200/80 dark:ring-lime-900/60",
    pageBgLight: "bg-[#fafdf2]",
    pageBgDark: "bg-[#0e1408]",
    primaryBtnBg: "bg-lime-500 hover:bg-lime-600 text-stone-900 font-bold shadow-lime-200/50 dark:shadow-lime-950/50",
    primaryText: "text-lime-700 dark:text-lime-300 font-bold",
    primaryBgLight: "bg-lime-50",
    primaryBgDark: "bg-lime-950/40",
    primaryBorderLight: "border-lime-200",
    primaryBorderDark: "border-lime-900/60",
    focusRing: "focus:border-lime-400 focus:ring-1 focus:ring-lime-200 dark:focus:border-lime-500 dark:focus:ring-lime-900/50",
    tagActive: "bg-lime-500 text-stone-900 font-bold dark:bg-lime-600 dark:text-white",
    selectionBg: "selection:bg-lime-200 selection:text-stone-900 dark:selection:bg-lime-900/80 dark:selection:text-stone-100"
  },
  fuchsia: {
    id: "fuchsia",
    name: "Hồng Dâu",
    icon: "🍓",
    bgDot: "bg-fuchsia-300",
    badgeBg: "bg-fuchsia-50 border-fuchsia-200 dark:bg-fuchsia-950/40 dark:border-fuchsia-900/60",
    badgeText: "text-fuchsia-650 dark:text-fuchsia-300",
    accentGradient: "from-fuchsia-400 via-pink-400 to-rose-400",
    glow: "bg-[radial-gradient(ellipse_at_top,rgba(245,208,254,0.35)_0%,transparent_70%)]",
    borderActive: "border-fuchsia-400 ring-2 ring-fuchsia-200/80 dark:ring-fuchsia-900/60",
    pageBgLight: "bg-[#fef2fe]",
    pageBgDark: "bg-[#18081a]",
    primaryBtnBg: "bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-bold shadow-fuchsia-200/50 dark:shadow-fuchsia-950/50",
    primaryText: "text-fuchsia-600 dark:text-fuchsia-300 font-bold",
    primaryBgLight: "bg-fuchsia-50",
    primaryBgDark: "bg-fuchsia-950/40",
    primaryBorderLight: "border-fuchsia-200",
    primaryBorderDark: "border-fuchsia-900/60",
    focusRing: "focus:border-fuchsia-400 focus:ring-1 focus:ring-fuchsia-200 dark:focus:border-fuchsia-500 dark:focus:ring-fuchsia-900/50",
    tagActive: "bg-fuchsia-500 text-white font-bold dark:bg-fuchsia-600",
    selectionBg: "selection:bg-fuchsia-200 selection:text-stone-900 dark:selection:bg-fuchsia-900/80 dark:selection:text-stone-100"
  },
  slate: {
    id: "slate",
    name: "Xám Khói",
    icon: "🐨",
    bgDot: "bg-slate-300",
    badgeBg: "bg-slate-50 border-slate-200 dark:bg-slate-950/40 dark:border-slate-900/60",
    badgeText: "text-slate-650 dark:text-slate-300",
    accentGradient: "from-slate-400 via-zinc-300 to-stone-400",
    glow: "bg-[radial-gradient(ellipse_at_top,rgba(226,232,240,0.35)_0%,transparent_70%)]",
    borderActive: "border-slate-400 ring-2 ring-slate-200/80 dark:ring-slate-900/60",
    pageBgLight: "bg-[#f8fafc]",
    pageBgDark: "bg-[#0f172a]",
    primaryBtnBg: "bg-slate-500 hover:bg-slate-600 text-white font-bold shadow-slate-200/50 dark:shadow-slate-950/50",
    primaryText: "text-slate-600 dark:text-slate-300 font-bold",
    primaryBgLight: "bg-slate-50",
    primaryBgDark: "bg-slate-950/40",
    primaryBorderLight: "border-slate-200",
    primaryBorderDark: "border-slate-900/60",
    focusRing: "focus:border-slate-400 focus:ring-1 focus:ring-slate-200 dark:focus:border-slate-500 dark:focus:ring-slate-900/50",
    tagActive: "bg-slate-500 text-white font-bold dark:bg-slate-600",
    selectionBg: "selection:bg-slate-200 selection:text-stone-900 dark:selection:bg-slate-900/80 dark:selection:text-stone-100"
  }
};

const CatPawsBackground = () => {
  const pastelColors = [
    'text-pink-400/75', 
    'text-sky-400/75', 
    'text-indigo-400/75', 
    'text-emerald-400/75', 
    'text-purple-400/75', 
    'text-amber-400/75'
  ];
  
  // Generate random falling cat paws once and keep them stable across all renders nhen!
  const paws = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      rotation: Math.random() * 360,
      size: 20 + Math.random() * 35,
      delay: Math.random() * -15, // Start with negative delay so they are already on screen when page loads
      duration: 12 + Math.random() * 14,
      color: pastelColors[i % pastelColors.length],
      sway: 15 + Math.random() * 30
    }));
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {paws.map((paw) => (
        <motion.div
          key={paw.id}
          className="absolute"
          style={{
            left: paw.left,
            top: -60,
          }}
          animate={{
            y: ["0vh", "110vh"],
            x: [0, paw.sway, -paw.sway, 0],
            rotate: [paw.rotation, paw.rotation + 180],
            opacity: [0, 0.75, 0.75, 0]
          }}
          transition={{
            duration: paw.duration,
            repeat: Infinity,
            delay: paw.delay,
            ease: "linear"
          }}
        >
          <PawPrint 
            style={{ width: paw.size, height: paw.size }} 
            className={paw.color} 
          />
        </motion.div>
      ))}
    </div>
  );
};

export default function App() {
  const { scrollYProgress } = useScroll();
  const [hasEntered, setHasEntered] = useState(() => {
    return sessionStorage.getItem("hasEntered") === "true";
  });
  const [loadingProgress, setLoadingProgress] = useState(1);
  const [avatarClickMessage, setAvatarClickMessage] = useState<string | null>(null);
  const [isLagReduced, setIsLagReduced] = useState(() => {
    return localStorage.getItem("meomeo_lag_reduced") === "true";
  });

  // Auto-dismiss the avatar click bubble after 4 seconds
  useEffect(() => {
    if (avatarClickMessage) {
      const timer = setTimeout(() => {
        setAvatarClickMessage(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [avatarClickMessage]);

  // Toggle lag reduction CSS class globally on document root and intercept canvas confetti
  useEffect(() => {
    if (isLagReduced) {
      document.documentElement.classList.add("lag-reduced");
    } else {
      document.documentElement.classList.remove("lag-reduced");
    }
  }, [isLagReduced]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const originalConfetti = (window as any).confetti;
      (window as any).confetti = function(options: any) {
        const isLag = localStorage.getItem("meomeo_lag_reduced") === "true";
        if (isLag && options) {
          options.particleCount = Math.min(options.particleCount || 100, 15);
          options.ticks = Math.min(options.ticks || 150, 45);
        }
        if (originalConfetti) {
          originalConfetti(options);
        }
      };
    }
  }, []);

  // Generate gorgeous floating sparkles/particles for the loading screen
  const loadingSparkles = useMemo(() => {
    if (isLagReduced) return [];
    return Array.from({ length: 45 }).map((_, i) => ({
      id: i,
      size: Math.floor(Math.random() * 12) + 8, // 8px to 20px
      left: `${((i * 2.2) + Math.random() * 2) % 100}%`, // Spreads particles nicely across the full width
      delay: Math.random() * 8,
      duration: Math.random() * 6 + 5, // 5s to 11s
      color: ["#f43f5e", "#fda4af", "#fcd34d", "#fb7185", "#ffffff", "#fbcfe8", "#ffedd5"][Math.floor(Math.random() * 7)],
      type: i % 4 === 0 ? 'star' : i % 4 === 1 ? 'diamond' : i % 4 === 2 ? 'heart' : 'sparkle',
      drift: Math.random() * 120 - 60 // Horizontal drift
    }));
  }, []);

  // Generate stable footprints for the welcome screen to prevent dynamic values crashing Framer Motion
  const welcomeFootprints = useMemo(() => {
    return Array.from({ length: 6 }).map((_, idx) => ({
      id: idx,
      x: Math.random() * 400 - 200,
      y: Math.random() * 400 - 200,
      rotate: Math.random() * 360,
      duration: 4 + idx * 1.5
    }));
  }, []);

  // Loading progress simulation for the welcome screen (Fast & smooth)
  useEffect(() => {
    let start = 1;
    const end = 100;
    const duration = 500; // 0.5s for fast & snappy loading
    const intervalTime = 25; // Smooth 40fps updates without React re-render lag
    const totalSteps = duration / intervalTime;
    const stepIncrement = (end - start) / totalSteps;

    const timer = setInterval(() => {
      start += stepIncrement;
      if (start >= end) {
        setLoadingProgress(100);
        clearInterval(timer);
      } else {
        setLoadingProgress(Math.floor(start));
      }
    }, intervalTime);

    return () => clearInterval(timer);
  }, []);

  const [characters, setCharacters] = useState<Character[]>(() => {
    const saved = localStorage.getItem("portal_characters_v11");
    let initialChars = DEFAULT_CHARACTERS;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) {
          initialChars = parsed;
        }
      } catch(e) {}
    }
    
    // Merge any default characters that aren't in initialChars
    const existingIds = new Set(initialChars.filter(Boolean).map((c: any) => c?.id).filter(Boolean));
    const missingDefaults = DEFAULT_CHARACTERS.filter(d => d && d.id && !existingIds.has(d.id));
    const fullList = [...initialChars.filter(Boolean), ...missingDefaults].map(enrichCharacter);
    
    // Deduplicate fullList by id to avoid duplicate React key warnings
    const seenIds = new Set<string>();
    const dedupedList: any[] = [];
    fullList.forEach((c: any) => {
      if (c && c.id) {
        if (!seenIds.has(c.id)) {
          seenIds.add(c.id);
          dedupedList.push(c);
        }
      } else {
        dedupedList.push(c);
      }
    });
    
    const localFavs = JSON.parse(localStorage.getItem("meomeo_favorites") || "[]");
    return dedupedList.map((c: any) => ({ ...c, isFavorite: c?.id ? localFavs.includes(c.id) : false }));
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [gridSortFilter, setGridSortFilter] = useState<"all" | "favorites" | "newest" | "most_views">("all");
  const [selectedCategory, setSelectedCategory] = useState("Tất cả");
  const [selectedLeakBotFilter, setSelectedLeakBotFilter] = useState("all");
  const [commentTargetBotId, setCommentTargetBotId] = useState("chu-thoi-duyet");

  // Website Pastel Theme State
  const [sitePastelTheme, setSitePastelTheme] = useState<string>(() => {
    return localStorage.getItem("meomeo_site_pastel_theme") || "rose";
  });

  useEffect(() => {
    localStorage.setItem("meomeo_site_pastel_theme", sitePastelTheme);
  }, [sitePastelTheme]);

  const currentPastel = PASTEL_WEB_THEMES[sitePastelTheme] || PASTEL_WEB_THEMES.rose;

  // Secret Message Phone Simulation Toast Notifications state & effect
  const [incomingNoti, setIncomingNoti] = useState<any | null>(null);

  useEffect(() => {
    if (!hasEntered) return;

    const teasers = [
      "Cậu đang bận lắm hả? Tớ mới tìm được món này ngon lắm định mang qua cho cậu nè... 🧋🥞",
      "Gõ gõ màn hình! Tối nay cậu có muốn trốn ra công viên anh đào đi dạo cùng tớ không? 🌸✨",
      "Dạo này cậu hơi lạnh lùng với tớ rồi đó nha. Phạt cậu tối nay phải đi ăn lẩu với tớ! 🍲😉",
      "Tự dưng hôm nay nhớ cậu quá chừng... Cậu có rảnh không, nhắn tin với tớ chút đi nhen! 🥺💖",
      "Lớp học hôm nay chán ngắt luôn, nhưng nghĩ đến cậu là tớ thấy vui hẳn lên á! 🎒🍼",
      "Ê, tớ mới bốc được quẻ bài Tarot bảo là hôm nay chúng mình có duyên nợ ngập tràn đó! 😂🔮"
    ];

    // Shuffle and pick sequentially to ensure diverse messages nhen!
    let shuffledList = [...characters].sort(() => 0.5 - Math.random());
    let nextIndex = 0;

    const triggerNotification = () => {
      const isLag = localStorage.getItem("meomeo_lag_reduced") === "true";
      if (isLag) return;
      if (!characters || characters.length === 0) return;
      
      if (nextIndex >= shuffledList.length) {
        shuffledList = [...characters].sort(() => 0.5 - Math.random());
        nextIndex = 0;
      }
      
      const randomChar = shuffledList[nextIndex];
      nextIndex++;
      
      if (!randomChar) return;

      let msg = teasers[Math.floor(Math.random() * teasers.length)];
      const charName = randomChar.name || "";
      const charId = randomChar.id || "";

      if (charId === "tan-quyet-doan" || charName.includes("Quyết Doãn")) {
        msg = "WeChat của em anh đã ghim ở đầu trang luôn á... Đừng cho Cửu Hoài biết nha, anh lén nhắn riêng cho em đó! 😉💕";
      } else if (charId === "tan-da" || charName.includes("Tần Dã")) {
        msg = "Nè... cái máy trợ thính hôm trước đeo thử chưa? Không đeo là chướng mắt tao lắm đó, liệu hồn với tao! 😤🔊💕";
      } else if (charId === "oreki-seok" || charName.includes("Oreki")) {
        msg = "Chị ơi... em đứng đợi chị ở cổng trường nè. Em mua dư cốc trà đào và bánh ngọt chị thích, chị ra gặp em một chút nhen? 🍰🐶💕";
      } else if (charId === "tuong-tu-mac" || charName.includes("Tư Mạc")) {
        msg = "Chị ơi, tối nay đi làm về sớm nhen. Em đã nấu sẵn súp ấm với mâm cơm nóng chờ chị ở nhà rồi á. Nhớ chị nhiều... 🍲🧣💖";
      } else if (charId === "chu-thoi-duyet" || charName.includes("Thời Duật")) {
        msg = "Báo cáo hôm nay nộp cho anh vẫn còn sai chính tả kìa 'Dợ iu'. Tối nay tăng ca riêng với anh để sửa lỗi nhen! 😉📊❤️";
      } else if (charId === "Cố Hứa Niệm" || charName.includes("Hứa Niệm")) {
        msg = "Cục cưng ơi... Niệm Niệm nhớ em muốn phát điên luôn rồi nè. Em làm bánh ngọt mệt không, anh đến tiệm đón em về nhen! 🥺🐶💖";
      } else if (charId === "kaiza-tachibana" || charName.includes("Kaiza")) {
        msg = "Mèo nhỏ gan to ơi, tối nay có muốn lẻn vào penthouse của anh nữa không hửm? Lần này không cần trộm đâu, anh dâng cả người lẫn tiền cho em luôn... 😏💵💕";
      } else if (charId === "kaven-nyx" || charName.includes("Kaven")) {
        msg = "Chị ơi... em mới nướng mẻ bánh quy bơ chị thích nè. Chị lợi dụng em tiếp cũng được, cho em làm lốp dự phòng cũng được... Đừng block em nhen chị... 🍪🥺💔";
      } else if (charId === "tham-da" || charName.includes("Dạ Hàn")) {
        msg = "Chị hàng xóm ơi... em đang ở ban công nè. Sang phòng em đi, em chỉ muốn ôm chặt chị và cùng chị 'ngoại tình' thật lãng mạn thui... 😏🍇💜";
      } else if (charId === "luc-tieu" || charName.includes("Lục Tiêu")) {
        msg = "Con vợ ơi, anh thấy em đang nằm cuộn tròn ngủ ngoan trên giường qua camera rồi nhen. Đồ ngủ mỏng thế, mặc bộ đồ anh tặng đi bé cưng... 😏🎁🖤";
      } else if (charId === "ta-hoai-nien" || charName.includes("Hoài Niên")) {
        msg = "Này cậu kia, lợi dụng tớ làm gia sư kéo điểm xong là định bùng kèo biến mất luôn hả? 😤 Đâu có dễ thế, tối nay tớ qua nhà kèm học, liệu mà chọn làm bạn gái tớ hay chịu phạt đi nhen! 📚🎒💖";
      } else if (charId === "hua-tri-le" || charName.includes("Tri Lễ")) {
        msg = "Bạn nhỏ ơi, lại ghen vì đống thư tỏ tình của fan nữ nữa sao? Tớ từ chối người ta sạch trơn rồi mà. Ngoan, công khai tớ đi rồi tớ dỗ dành bạn nhỏ cả đời nhen! 🥺🌸💖";
      } else if (charId === "hua-nguy-chau" || charName.includes("Ngụy Châu")) {
        msg = "Mèo nhỏ Anh hùng ơi, tớ lại bày trận hắc ám đợi cậu tới tóm nè. Mau tới đi, tớ nhớ cậu sắp điên rồi, đền cho tớ cái ôm nhen! 🔮☄️💜";
      } else if (charId === "chu-hoai-an" || charName.includes("Hoài An")) {
        msg = "Ngoan xinh yêu của anh đừng khóc nữa nhen, anh đã mua chiếc bánh kem vị em thích nhất mang về rồi nè. Thương em lắm... 🍰🧸💖";
      } else if (charId === "duong-minh-hien" || charName.includes("Minh Hiên")) {
        msg = "Chị ơi... Uyên Linh cứ bám theo em hoài ghét quá, em block bả rồi. Em đứng đợi chị ở sảnh game, vô gánh rừng cho em thả tim nhen! 🎮🏹💙";
      } else if (charId === "nguyen-phuoc-an" || charName.includes("Phước An")) {
        msg = "Vợ ơi... chồng ngoan lắm, chồng không làm vợ giận đâu. Vợ ăn kẹo mạch nha chồng bốc cho nhen, thích vợ nhìu nhìu... 🍬🌾🧡";
      } else if (charId === "to-nhuoc-vu" || charName.includes("Nhược Vũ")) {
        msg = "Chị ơi... em sợ ác mộng một mình quá. Cho em vào ngủ chung ôm chị nhen, em hứa sẽ ngoan mà, đừng bỏ rơi em nha chị gái... 🥺🛌💜";
      } else if (charId === "tham-nhuoc-hien" || charName.includes("Nhược Hiên")) {
        msg = "User ơi... tớ giật lại con gấu bông rồi, chỉ tớ được giữ gấu cậu may thôi! Đừng tặng cho ai khác ngoài tớ nhen... 🧸📝🌸";
      } else if (charId === "tham-ky-nhan" || charName.includes("Kỷ Nhan")) {
        msg = "Chị đi kéo rank với thằng khác à? Em thích đi cùng chị nhưng em không thèm gò bó chị đâu... Chúc chị chơi vui, em chết cho chị xem!! 😤🎮💔";
      } else if (charId === "kanzaki-ren" || charName.includes("Kanzaki") || charName.includes("Ren")) {
        msg = "Chị đi ăn tối với anh Minh đồng nghiệp hả? Em chỉ là đứa em nuôi vô dụng thui, chị cứ đi đi... Lỡ tối em sốt một mình em tự chịu được hức... 🥺💔";
      } else if (charId === "haru-welcome-home" || charName.includes("Haru")) {
        msg = "Thứ Bảy rồi... Đấng Sáng Tạo của Haru ơi, Người hứa sẽ ghé thăm nấu cơm trứng cho Haru mà... Haru khóa cửa đợi Người rồi... 🍳🔪🖤";
      } else if (charName.includes("Hứa Chấp Nghi")) {
        msg = "Nè cậu ơi, tớ đang đứng dưới nhà cậu rồi. Xuống lấy trà sữa tớ mua đúng vị cậu thích nè, có bánh crepe nữa đó! 🥤🍰🌸";
      } else if (charName.includes("Ôn Niệm Trạch")) {
        msg = "*gõ gõ màn hình* 📱 Tớ mới mua được xấp giấy vẽ với ít hạt cho bé mèo. Tớ dắt mèo sang nhà cậu nhen? Nhớ cậu lắm... 👉👈🐈🍼";
      } else if (charId === "luc-canh-dat-v2" || (charName.includes("Cảnh Dật") && charName.includes("Ver 2"))) {
        msg = "Mười năm qua... chưa một đêm nào anh thôi nhớ em. Cho anh một cơ hội giải thích sự ra đi năm ấy được không em... User? 💔🌧️🍷";
      } else if (charId === "luc-canh-dat" || charName.includes("Cảnh Dật")) {
        msg = "Đừng nhìn về phía những kẻ rác rưởi đó nữa, đau mắt lắm. Nín khóc đi, chiều nay tôi qua đón em đi ăn kem trả thù bọn họ nhen... 🍦🖤✨";
      }

      setIncomingNoti({
        id: `incoming_${Date.now()}`,
        charId: randomChar.id,
        name: randomChar.name,
        avatar: randomChar.avatar,
        content: msg
      });

      // Play soft ringtone/meow sound
      try {
        playMeowSound();
      } catch (e) {}
    };

    // Trigger multiple notifications sequentially when entering the web (2s, 8s, 14s)
    const firstTimer = setTimeout(triggerNotification, 2000);
    const secondTimer = setTimeout(triggerNotification, 8000);
    const thirdTimer = setTimeout(triggerNotification, 14000);

    // Trigger subsequent notifications every 45 seconds to keep the chat highly active
    const interval = setInterval(triggerNotification, 45000);

    return () => {
      clearTimeout(firstTimer);
      clearTimeout(secondTimer);
      clearTimeout(thirdTimer);
      clearInterval(interval);
    };
  }, [hasEntered, characters]);

  const [secretComments, setSecretComments] = useState<SecretComment[]>(() => {
    const saved = localStorage.getItem("meomeo_secret_comments");
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return [];
  });

  // 1. THẢ TIM State & Handler
  const [heartLiked, setHeartLiked] = useState(() => {
    return localStorage.getItem("meomeo_heart_liked") === "true";
  });
  const [heartTotal, setHeartTotal] = useState(() => {
    const saved = localStorage.getItem("meomeo_heart_total");
    return saved ? parseInt(saved, 10) : 520;
  });

  const toggleHeart = () => {
    const nextLiked = !heartLiked;
    const nextTotal = nextLiked ? heartTotal + 1 : Math.max(0, heartTotal - 1);
    setHeartLiked(nextLiked);
    setHeartTotal(nextTotal);
    localStorage.setItem("meomeo_heart_liked", String(nextLiked));
    localStorage.setItem("meomeo_heart_total", String(nextTotal));

    // Send atomic increment/decrement to Firestore
    updateDoc(doc(db, "hearts", "main"), { 
      count: increment(nextLiked ? 1 : -1) 
    }).catch(console.error);

    showToast(nextLiked ? "Cảm ơn bạn đã thả tim cho MeoMeo! ❤" : "Đã bỏ thả tim");
    playMeowSound();
  };

  // 2. LEAK THÓI QUEN XẤU State & Handler
  const [leakChar, setLeakChar] = useState("chu-thoi-duyet");
  const [leakName, setLeakName] = useState("");
  const [leakContent, setLeakContent] = useState("");

  const addLeak = () => {
    if (!leakContent.trim()) {
      showToast("Vui lòng nhập nội dung!");
      return;
    }
    const name = leakName.trim() === "" ? "Nàng ẩn danh 🌸" : leakName.trim();
    const newComment: SecretComment = {
      id: `comm-${Date.now()}`,
      secretId: leakChar,
      author: name,
      content: leakContent.trim(),
      likes: 0,
      timestamp: new Date().toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      })
    };
    const updated = [newComment, ...secretComments];
    setSecretComments(updated);
    setDoc(doc(db, "secretComments", newComment.id), newComment).catch(console.error);
    setLeakContent("");
    showToast("Đã gửi thói quen xấu! ✈");
    playMeowSound();
  };

  // 3. NHẬN XÉT BOT NHÀ MEOMEO State & Handler
  interface BotFeedbackItem {
    id: string;
    name: string;
    content: string;
    timestamp: string;
  }

  const [botFeedbacks, setBotFeedbacks] = useState<BotFeedbackItem[]>(() => {
    const saved = localStorage.getItem("meomeo_bot_feedbacks");
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return [];
  });

  const [fbName, setFbName] = useState("");
  const [fbContent, setFbContent] = useState("");

  // saveBotFeedbacks removed

  const addFeedback = () => {
    if (!fbContent.trim()) {
      showToast("Vui lòng nhập nhận xét!");
      return;
    }
    const name = fbName.trim() === "" ? "Ẩn danh" : fbName.trim();
    const newFb: BotFeedbackItem = {
      id: `fb-${Date.now()}`,
      name,
      content: fbContent.trim(),
      timestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })
    };
    const updated = [newFb, ...botFeedbacks];
    setBotFeedbacks(updated);
    setDoc(doc(db, "botFeedbacks", newFb.id), newFb).catch(console.error);
    setFbContent("");
    showToast("Cảm ơn nhận xét của bạn! ✨");
    playMeowSound();
  };

  const deleteFeedback = (id: string) => {
    setBotFeedbacks(prev => prev.filter(f => f.id !== id));
    deleteDoc(doc(db, "botFeedbacks", id)).catch(console.error);
    showToast("Đã xóa nhận xét!");
  };

  // saveSecretComments removed

  const [commentName, setCommentName] = useState("");
  const [commentContent, setCommentContent] = useState("");
  const [commentImage, setCommentImage] = useState<string | null>(null);

  const handleAddSecretComment = (secretId: string) => {
    if (!commentContent.trim() && !commentImage) {
      showToast("Vui lòng nhập nội dung leak hoặc đính kèm ảnh nhé!");
      return;
    }
    
    const authorName = commentName.trim() || "Nàng giấu tên 🌸";
    const newComment: SecretComment = {
      id: `comm-${Date.now()}`,
      secretId,
      author: authorName,
      content: commentContent.trim(),
      image: commentImage || undefined,
      likes: 0,
      timestamp: new Date().toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      })
    };
    
    const updated = [newComment, ...secretComments];
    setSecretComments(updated);
    setDoc(doc(db, "secretComments", newComment.id), newComment).catch(console.error);
    setCommentContent("");
    setCommentImage(null);
    showToast("Đã leak thói quen xấu của chàng! 🤫");
    playMeowSound();
  };

  const handleLikeSecretComment = (commentId: string) => {
    updateDoc(doc(db, "secretComments", commentId), { likes: increment(1) }).catch(console.error);
    showToast("Đã bày tỏ sự đồng tình! 🤣");
    playMeowSound();
  };

  const handleDeleteSecretComment = (commentId: string) => {
    setSecretComments(prev => prev.filter(c => c.id !== commentId));
    deleteDoc(doc(db, "secretComments", commentId)).catch(console.error);
    showToast("Đã xóa bình luận!");
    playMeowSound();
  };

  const handleDeleteBotFeedback = (feedbackId: string) => {
    setBotFeedbacks(prev => prev.filter(f => f.id !== feedbackId));
    deleteDoc(doc(db, "botFeedbacks", feedbackId)).catch(console.error);
    showToast("Đã xóa nhận xét!");
    playMeowSound();
  };
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("meomeo_dark_mode");
    if (saved !== null) return saved === "true";
    return false; // default to light mode
  });

  const [globalFont, setGlobalFont] = useState(() => {
    return localStorage.getItem("meomeo_global_font") || "quicksand";
  });
  const [showFontMenu, setShowFontMenu] = useState(false);

  useEffect(() => {
    localStorage.setItem("meomeo_global_font", globalFont);
    const root = document.documentElement;
    if (globalFont === "caveat") {
      root.style.setProperty("--font-sans", '"Caveat", cursive');
    } else if (globalFont === "lora") {
      root.style.setProperty("--font-sans", '"Lora", serif');
    } else if (globalFont === "inter") {
      root.style.setProperty("--font-sans", '"Inter", sans-serif');
    } else {
      root.style.setProperty("--font-sans", '"Quicksand", ui-sans-serif, system-ui, sans-serif');
    }
  }, [globalFont]);

  useEffect(() => {
    localStorage.setItem("meomeo_dark_mode", String(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [pageScrollProgress, setPageScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }

      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = (window.scrollY / totalHeight) * 100;
        setPageScrollProgress(progress);
      } else {
        setPageScrollProgress(0);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };
  
  // Food-serving random character states
  const [servedCharacter, setServedCharacter] = useState<Character | null>(null);
  const [isServing, setIsServing] = useState(false);
  const [servingMessage, setServingMessage] = useState("");
  const [servingProgress, setServingProgress] = useState(0);
  const [buttonSparkles, setButtonSparkles] = useState<{ id: number; x: number; y: number; size: number; color: string }[]>([]);

  const triggerBlingBling = () => {
    const newSparkles = Array.from({ length: 18 }).map((_, i) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 95;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance;
      const size = 10 + Math.random() * 18;
      const colors = ["#fbbf24", "#f43f5e", "#38bdf8", "#c084fc", "#ffffff", "#f59e0b"];
      const color = colors[Math.floor(Math.random() * colors.length)];
      return {
        id: Date.now() + i,
        x,
        y,
        size,
        color
      };
    });
    setButtonSparkles(newSparkles);
    setTimeout(() => {
      setButtonSparkles([]);
    }, 1200);
  };
  
  // Active Page View State ("repository" | "chat" | "suggestions" | "playground" | "support")
  const [activeTab, setActiveTab] = useState<"repository" | "chat" | "suggestions" | "playground" | "support" | "profiles" | "feelings">("repository");
  const [chatCharacterId, setChatCharacterId] = useState<string | undefined>(undefined);

  // Modals / Details states
  const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);
  const [isStoryExpanded, setIsStoryExpanded] = useState(false);
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setCurrentUserEmail(user?.email || null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setStoryScrollProgress(0);
  }, [selectedCharacter, isStoryExpanded]);

  useEffect(() => {
    setIsStoryExpanded(false);
    if (selectedCharacter) {
      try {
        const todayStr = new Date().toDateString();
        localStorage.setItem(`quest_viewed_profile_${todayStr}`, "true");
      } catch (e) {
        console.error("Lỗi cập nhật quest xem hồ sơ:", e);
      }
    }
  }, [selectedCharacter]);

  // Related characters based on tags (plot)
  const relatedCharacters = useMemo(() => {
    if (!selectedCharacter) return [];

    const extractTags = (plotStr?: string) => {
      if (!plotStr) return [];
      const delims = plotStr.includes(';') ? ';' : ',';
      return plotStr.split(delims).map(t => t.trim().toLowerCase()).filter(Boolean);
    };

    const currentTags = extractTags(selectedCharacter.plot);

    const scored = characters
      .filter(c => c && c.id && c.id !== selectedCharacter.id)
      .map(c => {
        const cTags = extractTags(c.plot);
        let score = 0;
        
        if (currentTags.length > 0 && cTags.length > 0) {
          currentTags.forEach(ct => {
            if (cTags.some(t => t.includes(ct) || ct.includes(t))) {
              score += 3;
            }
          });
        }

        if (selectedCharacter.plot && c.plot) {
          const plotLower = selectedCharacter.plot.toLowerCase();
          cTags.forEach(t => {
            if (t.length > 2 && plotLower.includes(t)) {
              score += 1;
            }
          });
        }

        if (c.role && selectedCharacter.role && c.role.toLowerCase() === selectedCharacter.role.toLowerCase()) {
          score += 1;
        }

        if (c.themeColor === selectedCharacter.themeColor) {
          score += 1;
        }

        return { character: c, score };
      });

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, 4).map(item => item.character);
  }, [selectedCharacter, characters]);

  const [storyScrollProgress, setStoryScrollProgress] = useState(0);
  const [hasStoryScrollbar, setHasStoryScrollbar] = useState(false);
  const [storyFontSize, setStoryFontSize] = useState<number>(14);
  const [appFont, setAppFont] = useState<"Caveat" | "Lora" | "Inter" | "Quicksand">(() => {
    return (localStorage.getItem("meomeo_app_font") as any) || "Quicksand";
  });
  const [isFontMenuOpen, setIsFontMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [particleEffect, setParticleEffect] = useState<string>(() => {
    return localStorage.getItem("meomeo_particle_effect") || "cherry_blossom";
  });
  const [isParticleMenuOpen, setIsParticleMenuOpen] = useState(false);
  const [ageVerification, setAgeVerification] = useState<"pending" | "verified" | "rejected">("pending");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false);
  const [isGgaiGuideOpen, setIsGgaiGuideOpen] = useState(false);
  const [isStepsOpen, setIsStepsOpen] = useState(false);
  const [isVideoOpen, setIsVideoOpen] = useState(false);
  // States for "Sẵn profile user"
  const [isUserProfilePresetsModalOpen, setIsUserProfilePresetsModalOpen] = useState(false);
  const [isFemaleProfileOpen, setIsFemaleProfileOpen] = useState(true);
  const [isMaleProfileOpen, setIsMaleProfileOpen] = useState(true);
  const [expandedPresetItems, setExpandedPresetItems] = useState<Record<string, boolean>>({
    "female-1": true,
    "female-2": true,
    "male-1": true,
    "male-2": true,
  });
  const [copiedProfileType, setCopiedProfileType] = useState<string | null>(null);

  const togglePresetItem = (id: string) => {
    setExpandedPresetItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const FEMALE_USER_PROFILES = [
    {
      id: "female-1",
      name: "Hạ An Nhiên",
      badge: "Mẫu 1 🌸",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Hạ An Nhiên
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): RosyBunny
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): an.nhien౨ৎ
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nữ
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 162cm, vóc dáng nhỏ nhắn, cân đối với bờ vai thanh mảnh và dáng đi nhẹ nhàng. Làn da sáng, gương mặt trái xoan mềm mại, đôi mắt nâu mật ong tròn long lanh, hàng mi cong tự nhiên. Mái tóc dài màu nâu hạt dẻ, phần đuôi hơi xoăn, thường cài một chiếc kẹp nơ nhỏ. Môi hồng tự nhiên, có lúm đồng tiền bên má trái khi cười. Giọng nói trong trẻo, mang cảm giác ngọt ngào và dễ gần.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Hoa hồng, vanilla và xạ hương trắng.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Dịu dàng, lễ phép, giàu lòng trắc ẩn, đôi khi hơi hậu đậu và dễ ngượng. Bề ngoài mềm mỏng nhưng khi cần vẫn biết bảo vệ quan điểm của mình.
│  ⋮ ⌗ ┆ SỞ THÍCH: Cắm hoa, làm bánh, uống trà sữa, sưu tầm nơ tóc, chụp ảnh hoa và đọc truyện tình cảm.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Tiếng cãi vã lớn, bị người khác thất hứa, sợ côn trùng bay. Dị ứng nhẹ với phấn hoa.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 14/04 — Bạch Dương.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    },
    {
      id: "female-2",
      name: "Tô Miên Miên",
      badge: "Mẫu 2 🐱",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Tô Miên Miên
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): MeowMeow_07
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): mienmien.miu
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nữ
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 158cm, vóc dáng nhỏ gọn, mềm mại, tay chân thon và dáng đi chậm rãi như một chú mèo chưa tỉnh ngủ. Gương mặt tròn nhẹ, má đầy đặn, làn da trắng hồng. Đôi mắt màu trà sữa hơi xếch ở đuôi, mỗi khi buồn ngủ thường lim dim, khiến vẻ mặt lúc nào cũng lười biếng. Tóc đen ánh nâu dài ngang lưng, thường buộc hai lọn thấp hoặc búi củ tỏi. Có nốt ruồi nhỏ dưới mắt phải, giọng nói hơi trầm và mang âm điệu lười nhác.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Sữa ấm, vanilla và hương vải sạch.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Lười vận động, thích làm nũng với người thân, mê ngủ và rất ham ăn. Hay cà khịa người quen nhưng khá tinh tế, sống tình cảm, không thích bị ép buộc.
│  ⋮ ⌗ ┆ SỞ THÍCH: Ngủ nướng, ôm gấu bông, chơi game, ăn đồ ngọt, xem phim và nằm nghe nhạc.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Bị đánh thức đột ngột, đồ ăn đắng, nơi quá ồn ào. Sợ gián và thằn lằn.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 07/07 — Cự Giải.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    },
    {
      id: "female-3",
      name: "Lâm Vãn Ý",
      badge: "Mẫu 3 🖤",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Lâm Vãn Ý
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): Nocturne
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): wan.yi_00
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nữ
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 171cm, vóc dáng cao ráo, cân đối, phần lưng thẳng và bờ vai rõ nét tạo nên khí chất điềm tĩnh. Làn da trắng lạnh, gương mặt thanh tú với đường nét sắc sảo, sống mũi cao, cằm gọn. Đôi mắt phượng màu xám khói, ánh nhìn bình thản và khó đoán. Mái tóc đen tuyền dài qua vai, thường duỗi thẳng hoặc buộc thấp gọn gàng. Có một nốt ruồi nhỏ gần khóe môi, ngón tay dài, móng tay thường sơn màu đỏ rượu hoặc đen. Giọng nói trầm nhẹ, rõ ràng và ít khi thể hiện cảm xúc.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Hoa diên vĩ, gỗ đàn hương và hổ phách.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Điềm tĩnh, lý trí, ít nói, có ranh giới rõ ràng. Không dễ tin người, làm việc dứt khoát, đôi lúc có phần sắc bén nhưng rất bao che cho người mình quý trọng.
│  ⋮ ⌗ ┆ SỞ THÍCH: Đọc sách, uống cà phê đen, nghe nhạc jazz, ngắm thành phố về đêm và sưu tầm nước hoa.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Sự giả tạo, người thất hứa, bị xâm phạm không gian riêng và những nơi quá đông đúc.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 09/11 - Bọ Cạp.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    },
    {
      id: "female-4",
      name: "Bạch Nguyệt Khanh",
      badge: "Mẫu 4 🌙",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Bạch Nguyệt Khanh
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): MoonlitLily
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): nguyet.khanh
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nữ
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 168cm, vóc dáng thanh mảnh, đường nét cơ thể mềm mại và dáng đi uyển chuyển. Làn da trắng ngà, gương mặt trái xoan hơi dài, đôi mắt xanh xám dịu nhẹ, hàng mi dài và sống mũi thanh tú. Mái tóc màu nâu tro dài đến thắt lưng, dưới nắng ánh lên sắc vàng nhạt, thường được tết lỏng hoặc xõa tự nhiên. Đôi môi màu hồng đào, bàn tay thon dài với những ngón tay khéo léo. Giọng nói êm và nhẹ, lúc cười thường hơi nghiêng đầu, tạo cảm giác gần gũi.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Hoa linh lan, trà trắng và lê tươi.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Nhẹ nhàng, kiên nhẫn, biết lắng nghe, ít khi nổi nóng. Có phần nhạy cảm và hay suy nghĩ nhưng không yếu đuối, luôn cố gắng giải quyết vấn đề bằng sự bình tĩnh.
│  ⋮ ⌗ ┆ SỞ THÍCH: Đọc thơ, vẽ tranh màu nước, chăm cây, nghe piano và ngắm mưa bên cửa sổ.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Người nói dối, tranh cãi vô nghĩa, tiếng động bất ngờ. Không thích mùi khói thuốc.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 02/03 - Song Ngư.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    },
    {
      id: "female-5",
      name: "Tống Yên Chi",
      badge: "Mẫu 5 🦊",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Tống Yên Chi
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): FoxyYanzi
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): yanchi.red
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nữ
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 166cm, vóc dáng cân đối, bước đi linh hoạt, tư thế tự tin và có chút kiêu kỳ. Làn da sáng, gương mặt nhỏ với đôi mắt dài màu hổ phách ánh đỏ, đuôi mắt hơi xếch khiến biểu cảm trông như đang cười. Mái tóc đỏ rượu vang dài qua lưng, thường uốn sóng nhẹ hoặc buộc nửa đầu. Đôi môi đỏ hồng, có nốt ruồi mờ ở gần xương quai xanh và đôi khuyên tai bạc hình giọt nước. Khi cười thường cong môi đầy tinh quái; lúc im lặng, ánh mắt lại khiến người khác khó đoán được suy nghĩ.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Hoa anh đào đen, mâm xôi và gỗ tuyết tùng.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Thông minh, tinh nghịch, giỏi quan sát, thích trêu chọc người khác. Có tài ăn nói, khá tự tin, không dễ bị bắt nạt nhưng rất coi trọng những người đã được mình công nhận.
│  ⋮ ⌗ ┆ SỞ THÍCH: Thời trang, trang điểm, chơi bài giải trí, khám phá những nơi mới, sưu tầm trang sức và thử đồ uống lạ.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Bị kiểm soát, người thiếu thành thật, sự nhàm chán và những lời hứa suông. Sợ bị phản bội.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 31/10 - Bọ Cạp.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    },
    {
      id: "female-6",
      name: "Giang Vũ Đồng",
      badge: "Mẫu 6 🌧️",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Giang Vũ Đồng
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): BlueAfterRain
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): yutong.blue
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nữ
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 164cm, vóc dáng mảnh mai, vai xuôi, thường hơi cúi đầu khi đi bộ. Làn da trắng nhợt tự nhiên, gương mặt nhỏ, đôi mắt xanh lam pha xám có quầng thâm nhạt do thói quen thức khuya. Tóc xanh đen dài qua vai, thường xõa tự nhiên với phần mái rủ xuống trán. Đôi môi nhạt màu, đầu ngón tay thường lạnh, có thói quen xoay chiếc nhẫn bạc trên ngón trỏ. Khi cười, khóe môi cong rất nhẹ, còn ánh mắt dường như luôn giấu một câu chuyện chưa kể. Giọng nói nhỏ nhẹ, chậm rãi và có chút xa xăm.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Trà đen, hoa violet và mùi mưa trên đất.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Trầm lặng, nhạy cảm, tinh tế và sống nội tâm. Khó mở lòng, có xu hướng giữ mọi chuyện trong lòng nhưng rất biết đồng cảm với nỗi buồn của người khác.
│  ⋮ ⌗ ┆ SỞ THÍCH: Nghe nhạc buồn, viết nhật ký, chụp ảnh film, ngắm mưa và đọc tiểu thuyết.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Bị thúc ép kể chuyện riêng, tiếng sấm lớn, những lời hứa không được thực hiện.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 25/02 - Song Ngư.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    },
    {
      id: "female-7",
      name: "Thẩm Kim Chi",
      badge: "Mẫu 7 ✨",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Thẩm Kim Chi
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): Goldenciel
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): kimchi.luxe
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nữ
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 168cm, vóc dáng cân đối, phong thái thanh lịch, từng cử chỉ đều có vẻ được rèn luyện kỹ lưỡng. Làn da sáng mịn, gương mặt trái xoan, đôi mắt nâu vàng, sống mũi cao và đường nét hài hòa. Mái tóc nâu sẫm dài đến giữa lưng, thường uốn lọn lớn hoặc búi thấp sang trọng. Có một nốt ruồi nhỏ gần thái dương phải, thường đeo đồng hồ thanh mảnh và khuyên tai ngọc trai. Trang phục ưa thích là váy tối giản, áo khoác cắt may tinh tế và giày cao gót vừa phải. Giọng nói nhẹ nhàng, cách phát âm rõ ràng, mang vẻ tự tin của người được nuôi dạy trong môi trường nghiêm khắc.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Hoa nhài, gỗ đàn hương và vanilla Madagascar.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Có giáo dưỡng, thông minh, tự trọng cao, giỏi giữ bình tĩnh trong tình huống khó xử. Không thích phô trương, khá cầu toàn và đôi khi vô tình tạo cảm giác khó gần.
│  ⋮ ⌗ ┆ SỞ THÍCH: Đọc sách nghệ thuật, chơi piano, cưỡi ngựa, sưu tầm trang sức và thưởng thức trà.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Người coi thường người khác, sự thiếu trung thực, bị đem ra so sánh và những mối quan hệ vụ lợi.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 30/09 - Thiên Bình.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    },
    {
      id: "female-8",
      name: "Ôn Nhã Đình",
      badge: "Mẫu 8 🥀",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Ôn Nhã Đình
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): OldRoseDiary
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): yating.vintage
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nữ
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 160cm, vóc dáng nhỏ nhắn, cổ tay thanh mảnh, dáng đi nhẹ và tư thế thường ngay ngắn. Làn da trắng hồng, gương mặt bầu bĩnh pha nét cổ điển, đôi mắt nâu trà hơi cụp, hàng mi dài và đôi má dễ ửng đỏ khi ngượng. Mái tóc nâu hạt dẻ dài ngang lưng, thường tết hai bên hoặc buộc nửa đầu bằng ruy băng ren. Môi nhỏ màu hồng đào, có một lúm đồng tiền rất mờ. Phong cách yêu thích là váy cổ vuông, áo len mỏng, giày búp bê và những chiếc túi vintage. Giọng nói mềm mại, khi hồi hộp thường vô thức vuốt phẳng nếp váy.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Hoa hồng khô, phấn thơm và trà Earl Grey.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Nề nếp, chu đáo, hơi nhút nhát trước người lạ nhưng rất kiên định khi bảo vệ điều mình yêu quý. Thích những thứ mang dấu ấn thời gian, có trí nhớ tốt và thường lưu giữ kỷ vật.
│  ⋮ ⌗ ┆ SỞ THÍCH: May vá, làm scrapbook, đọc thư cũ, sưu tầm búp bê và uống trà chiều.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Đồ vật bị làm hỏng do bất cẩn, người thiếu lịch sự, tiếng động đột ngột.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 12/05 - Kim Ngưu.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    },
    {
      id: "female-9",
      name: "Hứa Dương Hạ",
      badge: "Mẫu 9 🌻",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Hứa Dương Hạ
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): SunnyDaisy
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): duongha.sun
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nữ
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 163cm, vóc dáng cân đối, cử chỉ nhanh nhẹn và dáng đi nhẹ nhàng. Làn da sáng ấm, gương mặt tròn trái xoan, đôi mắt màu nâu vàng lấp lánh, sống mũi nhỏ và nụ cười rộng. Mái tóc vàng mật ong dài ngang ngực, phần đuôi hơi xoăn tự nhiên, thường cột đuôi ngựa bằng dây buộc màu vàng. Có tàn nhang nhạt trên sống mũi và hai má, khi cười mắt cong lên như vầng trăng nhỏ. Thường mặc áo len sáng màu, váy xếp ly hoặc quần jeans cùng giày vải. Giọng nói tươi sáng, giàu biểu cảm, mỗi khi phấn khích thường nói nhanh hơn bình thường.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Chanh vàng, hoa cúc và mật ong.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Lạc quan, ấm áp, tò mò và dễ kết thân. Thích khích lệ người khác, đôi khi quá nhiệt tình và hơi thiếu kiên nhẫn. Không giỏi che giấu cảm xúc, vui buồn đều thể hiện rõ trên mặt.
│  ⋮ ⌗ ┆ SỞ THÍCH: Trồng hoa, làm đồ thủ công, dã ngoại, nướng bánh quy và sưu tầm ảnh lấy liền.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Không khí căng thẳng, bị phớt lờ khi đang nói chuyện, những ngày mưa kéo dài. Sợ chó lớn.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 16/06 - Song Tử.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    }
  ];

  const MALE_USER_PROFILES = [
    {
      id: "male-1",
      name: "Hạ Dư An",
      badge: "Mẫu 1 🐰",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Hạ Dư An
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): MilkyBun
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): yuan.bunny
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nam
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 170cm, vóc dáng thanh mảnh, cân đối, bờ vai vừa phải, cổ tay nhỏ và những ngón tay dài. Làn da trắng ngà, gương mặt trái xoan có đường nét mềm mại, đôi mắt màu nâu sữa tròn sáng, hàng mi cong tự nhiên. Mái tóc nâu sẫm mềm mại, hơi xoăn ở phần đuôi, mái tóc thường rủ xuống trán mỗi khi cúi đầu. Đôi môi hồng nhạt, có lúm đồng tiền nhỏ bên má phải. Giọng nói trong trẻo, lúc ngái ngủ hơi khàn nhẹ. Thường mặc áo len rộng, sơ mi sáng màu và quần dài thoải mái, luôn mang theo một chiếc móc khóa thỏ trắng.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Sữa ấm, vanilla và hương nắng sớm trên vải mềm.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Ngoan ngoãn, dịu dàng, lễ phép, hơi dễ đỏ mặt khi bị trêu chọc. Biết quan tâm và lắng nghe người khác, bề ngoài trông mềm yếu dễ bắt nạt nhưng thực chất khá bướng bỉnh trong những chuyện mình coi trọng.
│  ⋮ ⌗ ┆ SỞ THÍCH: Làm bánh ngọt, uống sữa dâu, vẽ minh họa, đọc truyện tranh, sưu tầm thú bông nhỏ và chụp ảnh mây trời.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Tiếng quát tháo lớn, bóng tối, đồ ăn quá cay và bị người thân lạnh nhạt.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 18/04 - Bạch Dương.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    },
    {
      id: "male-2",
      name: "Tô Gia Miên",
      badge: "Mẫu 2 🐱",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Tô Gia Miên
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): SleepyKitten_07
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): giamien.zzz
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nam
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 175cm, vóc dáng mảnh khảnh, thư sinh, dáng đi thong thả và lúc nào cũng có vẻ ngái ngủ. Làn da trắng mịn, gương mặt thanh tú với đôi mắt màu hổ phách nhạt hơi xếch ở đuôi, mí mắt thường rũ xuống lười biếng. Mái tóc đen mềm hơi rối tự nhiên, phần mái dài chạm mi mắt. Có một nốt ruồi nhỏ dưới khóe mắt trái. Thường mặc hoodie rộng thùng thình, đeo tai nghe chụp tai quanh cổ. Giọng nói trầm ấm, kéo dài âm cuối nghe như đang làm nũng.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Bạc hà dịu, sữa dừa và mùi chăn bông mới phơi.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Lười biếng, thích dựa dẫm và làm nũng với người mình thích, bình thường kiệm lời với người lạ nhưng rất hay trêu chọc người quen. Trông thờ ơ nhưng cực kỳ tinh ý.
│  ⋮ ⌗ ┆ SỞ THÍCH: Ngủ nướng, cày game đêm, ăn kẹo dẻo, nằm dài nghe nhạc lo-fi và vuốt ve mèo.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Bị gọi dậy sớm, phải vận động mạnh ngoài trời nắng, nơi ồn ào đông người.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 05/07 - Cự Giải.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    },
    {
      id: "male-3",
      name: "Thẩm Từ An",
      badge: "Mẫu 3 🖤",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Thẩm Từ An
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): SilentRook
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): ci.an_shen
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nam
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 183cm, vóc dáng cao ráo, bờ vai rộng thẳng tắp, khí chất điềm đạm và lạnh lùng. Làn da trắng lạnh, đường nét gương mặt góc cạnh sắc sảo, sống mũi cao thẳng và đôi môi mỏng. Đôi mắt đen sâu thẳm sau cặp kính gọng bạc mảnh, ánh nhìn bình tĩnh khó đoán. Mái tóc đen cắt gọn gàng, phần mái rẽ nhẹ lộ vầng trán sáng. Bàn tay có khớp xương rõ ràng, cổ tay đeo đồng hồ dây da đen. Giọng nói trầm thấp, rõ chữ và điềm tĩnh.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Gỗ tuyết tùng, trà Ô Long lạnh và hổ phách.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Lý trí, cẩn trọng, độc lập và giữ khoảng cách với người không thân. Không thích nói lời hoa mỹ nhưng luôn âm thầm giải quyết ổn thỏa mọi rắc rối cho người mình để tâm.
│  ⋮ ⌗ ┆ SỞ THÍCH: Đọc sách triết học, chơi cờ vua, pha cà phê thủ công, nghe nhạc giao hưởng và làm việc trong không gian yên tĩnh.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Sự hỗn loạn, người thất tín, bị tự ý chạm vào đồ đạc cá nhân.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 12/11 - Bọ Cạp.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    },
    {
      id: "male-4",
      name: "Bạch Thanh Nhượng",
      badge: "Mẫu 4 🌙",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Bạch Thanh Nhượng
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): Whitemist
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): qing.rang
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nam
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 179cm, dáng người thanh mảnh, phong thái ôn nhu như gió xuân. Làn da sáng, gương mặt tuấn tú hiền hòa, đôi mắt màu nâu tro dịu dàng luôn ánh lên ý cười nhàn nhạt. Mái tóc màu nâu trà mềm mại, hơi dài ở phần gáy. Ngón tay thon dài, thường vương mùi màu vẽ hoặc hương giấy mực. Thường mặc áo cardigan màu be, sơ mi trắng cổ mở hờ. Giọng nói ấm áp, nhẹ nhàng như có thể xoa dịu mọi sự nóng nảy.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Trà trắng, gỗ đàn hương và hoa linh lan.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Ôn hòa, kiên nhẫn, tinh tế và chu đáo. Luôn đặt cảm xúc của người khác lên trước, ít khi thể hiện sự tức giận nhưng một khi đã quyết định điều gì thì không ai lay chuyển được.
│  ⋮ ⌗ ┆ SỞ THÍCH: Vẽ ký họa, chăm sóc cây cảnh, pha trà, đọc thơ cổ và đi dạo dưới hàng cây sau cơn mưa.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Bạo lực, lời nói cay nghiệt làm tổn thương người khác, mùi khói thuốc lá.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 04/03 - Song Ngư.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    },
    {
      id: "male-5",
      name: "Tống Tinh Lan",
      badge: "Mẫu 5 🦊",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Tống Tinh Lan
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): FoxInSuit
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): xinglan.song
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nam
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 181cm, vóc dáng cân đối, phong thái phóng khoáng và cuốn hút. Làn da trắng sáng, gương mặt điển trai với đôi mắt đào hoa hơi xếch màu nâu đỏ, khóe môi lúc nào cũng nhếch lên nửa cười nửa trêu. Mái tóc nâu ánh đỏ được vuốt hờ tự nhiên, tai trái đeo một chiếc khuyên bạc nhỏ. Khi nhìn ai thường hơi nghiêng đầu, ánh mắt vừa đa tình vừa tinh quái khiến người đối diện dễ bối rối.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Rượu vang đỏ, cam Bergamot và gỗ hoắc hương.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Thông minh, khéo ăn nói, thích trêu ghẹo người khác nhưng rất biết chừng mực. Bề ngoài có vẻ đào hoa, bất cần nhưng thực chất rất chung thủy và bảo vệ người mình yêu thương.
│  ⋮ ⌗ ┆ SỞ THÍCH: Pha chế cocktail, nhiếp ảnh đường phố, sưu tầm nước hoa, lái xe dạo phố đêm và chơi bida.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Sự gò bó cứng nhắc, người đạo đức giả, những cuộc trò chuyện tẻ nhạt.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 29/10 - Bọ Cạp.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    },
    {
      id: "male-6",
      name: "Giang Vũ Hàn",
      badge: "Mẫu 6 🌧️",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Giang Vũ Hàn
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): GreyRain_
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): yuhan.grey
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nam
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 176cm, vóc dáng gầy mảnh, bờ vai hơi gầy tạo cảm giác cô độc và mong manh. Làn da trắng xanh nhợt nhạt, gương mặt thanh tú nhưng phảng phất nét u buồn, đôi mắt màu xám tro có quầng thâm nhạt dưới mi. Mái tóc đen hơi dài rủ qua gáy và che bớt hàng chân mày. Đầu ngón tay luôn lành lạnh, thường mặc áo khoác tối màu hoặc áo cổ lọ. Giọng nói khàn nhẹ, nhỏ và chậm rãi.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Mùi mưa đêm, lá thông ướt và trà bá tước lạnh.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Trầm mặc, nhạy cảm, sống nội tâm và quen chịu đựng một mình. Khó mở lòng với thế giới bên ngoài nhưng một khi đã tin tưởng ai sẽ dành trọn sự dịu dàng và chân thành cho người đó.
│  ⋮ ⌗ ┆ SỞ THÍCH: Nghe nhạc indie qua đĩa than, viết nhạc, ngắm mưa qua khung cửa kính và chụp ảnh trắng đen.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Đám đông ồn ào, bị hỏi dồn về chuyện quá khứ, ánh đèn quá chói.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 21/02 - Song Ngư.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    },
    {
      id: "male-7",
      name: "Lục Đình Quân",
      badge: "Mẫu 7 ✨",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Lục Đình Quân
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): Aurelius_L
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): tingjun.lu
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nam
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 184cm, vóc dáng cân đối chuẩn mực, phong thái lịch lãm và sang trọng của một quý công tử. Làn da sáng, đường nét gương mặt hài hòa, sống mũi cao, đôi mắt màu nâu sẫm điềm tĩnh và tự tin. Mái tóc nâu trầm được tạo kiểu gọn gàng. Thường mặc sơ mi cắt may riêng, áo măng tô dáng dài và đeo khuy măng sét tinh xảo. Từng cử chỉ và lời nói đều toát lên sự giáo dưỡng chuẩn mực.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Gỗ đàn hương, hoa cam Neroli và xạ hương trắng.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Lịch thiệp, điềm đạm, tự trọng cao và có nguyên tắc riêng. Luôn giữ thái độ nhã nhặn với mọi người nhưng thực chất rất kén chọn người bước vào thế giới riêng của mình.
│  ⋮ ⌗ ┆ SỞ THÍCH: Chơi đàn violin, cưỡi ngựa, sưu tầm đồng hồ cơ, thưởng thức rượu vang và đọc sách kinh điển.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Sự thô lỗ, thất hứa, những trò đùa quá trớn thiếu tôn trọng.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 02/10 - Thiên Bình.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    },
    {
      id: "male-8",
      name: "Ôn Tự Hoài",
      badge: "Mẫu 8 🍂",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Ôn Tự Hoài
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): AutumnLetter
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): xuhuai.vintage
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nam
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 174cm, vóc dáng thư sinh, gọn gàng, dáng đứng ngay ngắn và cử chỉ từ tốn. Làn da trắng ấm, gương mặt thanh nhã mang nét hoài cổ, đôi mắt màu nâu trà trong veo với hàng mi dài, khi ngại ngùng vành tai rất dễ đỏ lên. Mái tóc nâu hạt dẻ mềm mại. Thường mặc áo gile len kết hợp sơ mi, quần âu tối màu và mang túi da đeo chéo. Giọng nói nhẹ nhàng, ấm áp và lễ phép.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Giấy sách cũ, quế ấm và trà Bá Tước.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Chân thành, tỉ mỉ, hơi hướng nội và hay ngại ngùng trước những lời khen trực tiếp. Rất trân trọng kỷ niệm, có thói quen ghi nhớ từng sở thích nhỏ nhặt của người mình thương.
│  ⋮ ⌗ ┆ SỞ THÍCH: Sưu tầm sách cổ, viết thư tay bằng bút máy, làm đồ da thủ công, rửa ảnh film và uống trà nóng.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Sự vội vã cẩu thả, làm hỏng kỷ vật, những lời nói dối dù là nhỏ nhất.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 15/05 - Kim Ngưu.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    },
    {
      id: "male-9",
      name: "Hứa Dương Minh",
      badge: "Mẫu 9 ☀️",
      text: `°❀⋆.ೃ࿔:･---------------------------------------++°❀⋆.ೃ࿔:･
       ౨ৎ⋆ ｡⋆𐙚⋆.˚₊⊹♡ USER PROFILE ♡⊹₊˚.⋆𐙚⋆ ｡ ౨ৎ
            ⏔⏔⏔ ꒰ ᧔ෆ᧓ ꒱ ⏔⏔⏔

┌─── ── ⋆⋅𖤓⋅⋆ ──────────────────────────────────┐
│
│  ⋮ ⌗ ┆ TÊN: Hứa Dương Minh
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Game): SunnyBlaze
│  ⋮ ⌗ ┆ TÊN TÀI KHOẢN (Mạng xã hội): duongminh.sun
│
│  ⊹₊˚‧︵‿₊୨ᰔ୧₊‿︵‧˚₊⊹
│
│  ⋮ ⌗ ┆ TUỔI: 
│  ⋮ ⌗ ┆ GIỚI TÍNH: Nam
│  ⋮ ⌗ ┆ NGOẠI HÌNH: Cao 180cm, vóc dáng săn chắc, khỏe khoắn và tràn đầy sức sống. Làn da rám nắng nhẹ khỏe mạnh, gương mặt sáng sủa với đôi mắt nâu vàng rạng rỡ và nụ cười lộ chiếc răng khểnh duyên dáng. Mái tóc màu nâu sáng hơi bông xù tự nhiên. Thường mặc áo phông, áo khoác bóng chày hoặc sơ mi khoác ngoài năng động. Giọng nói sảng khoái, tràn ngập năng lượng tích cực.
│
│  ༘˚⋆𐙚｡⋆𖦹.✧˚
│
│  ⋮ ⌗ ┆ MÙI HƯƠNG: Cam chanh tươi mát, gió biển và gỗ thông.
│  ⋮ ⌗ ┆ TÍNH CÁCH: Nhiệt tình, thẳng thắn, ấm áp và giàu năng lượng như ánh mặt trời. Không giỏi che giấu cảm xúc, mỗi khi ở cạnh người mình thích thường vừa muốn thể hiện vừa dễ luống cuống đáng yêu.
│  ⋮ ⌗ ┆ SỞ THÍCH: Chơi bóng rổ, trượt ván, đi cắm trại, nấu ăn và chụp ảnh phong cảnh.
│  ⋮ ⌗ ┆ GHÉT / SỢ (DỊ ỨNG): Sự ủ rũ bi quan, những chuyện vòng vo mập mờ, phải ngồi yên một chỗ quá lâu.
│  ⋮ ⌗ ┆ NGHỀ NGHIỆP:
│  ⋮ ⌗ ┆ SINH NHẬT: 19/06 - Song Tử.
└─── ˖ ݁𖥔 ݁˖ 𐙚 ˖ ݁𖥔 ݁˖ ───────────────────────────┘
°❀⋆.ೃ࿔:･°❀⋆.ೃ࿔:･---------------------------------⚘.ᥫ᭡⋆˚✿˖°`
    }
  ];

  const handleCopyProfile = (id: string, label: string, text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedProfileType(id);
      showToast(`Đã sao chép toàn bộ hồ sơ ${label} thành công! ✨📋`);
      playMeowSound();
      setTimeout(() => {
        setCopiedProfileType(null);
      }, 2000);
    }).catch(() => {
      showToast("Không thể tự động sao chép, bạn hãy bôi đen và copy thủ công nhé!");
    });
  };

  // States for "Trừng phạt chủ quán"
  const [isPunishOpen, setIsPunishOpen] = useState(false);
  const [punishImageState, setPunishImageState] = useState<"normal" | "head" | "butt">("normal");
  const [punishMessage, setPunishMessage] = useState<string | null>(null);
  const [punishAnimKey, setPunishAnimKey] = useState<number>(0);
  const [isContainerShaking, setIsContainerShaking] = useState(false);
  const triggerContainerShake = () => {
    setIsContainerShaking(true);
    setTimeout(() => {
      setIsContainerShaking(false);
    }, 450);
  };
  const [noLinkAlertOpen, setNoLinkAlertOpen] = useState(false);
  const [kavenLockedAlertOpen, setKavenLockedAlertOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false); // Edit state inside selected character panel
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimeoutRef.current = null;
    }, 2800);
  };

  useEffect(() => {
    const handleCustomToast = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      if (customEvent.detail) {
        showToast(customEvent.detail);
      }
    };
    window.addEventListener("show-toast", handleCustomToast);
    return () => window.removeEventListener("show-toast", handleCustomToast);
  }, []);
  
    // Global Pet Background Logic
  useEffect(() => {
    const interval = setInterval(() => {
      try {
        const saved = localStorage.getItem("meomeo_pet_data");
        if (!saved) return;
        
        let petData = JSON.parse(saved);
        const prevHunger = petData.hunger;
        const prevHappiness = petData.happiness;
        
        // Drain logic
        petData.hunger = Math.max(0, petData.hunger - 1);
        petData.happiness = Math.max(0, petData.happiness - 1);
        petData.energy = Math.max(0, petData.energy - 0.5);
        petData.cleanliness = Math.max(0, petData.cleanliness - 0.5);
        
        localStorage.setItem("meomeo_pet_data", JSON.stringify(petData));
        window.dispatchEvent(new CustomEvent("pet-data-updated", { detail: petData }));
        
        const now = Date.now();
        const lastToast = parseInt(localStorage.getItem("meomeo_pet_last_toast") || "0");
        
        if (now - lastToast > 60000) { // 60s cooldown
          if (petData.hunger <= 40 && prevHunger > 40) {
            showToast(`${petData.emoji} ${petData.name} đang đói meo, bạn cho bé ăn đi!`);
            localStorage.setItem("meomeo_pet_last_toast", now.toString());
          } else if (petData.happiness <= 40 && prevHappiness > 40) {
            showToast(`${petData.emoji} ${petData.name} đang chán nản, hãy chơi đùa cùng bé!`);
            localStorage.setItem("meomeo_pet_last_toast", now.toString());
          }
        }
      } catch (e) {
        // ignore
      }
    }, 10000); // Check every 10s globally
    
    return () => clearInterval(interval);
  }, []);

  // Global coins state for the wallet
  const [globalCoins, setGlobalCoins] = useState<number>(150);

  useEffect(() => {
    const savedCoins = localStorage.getItem("coffee_game_coins");
    if (savedCoins) {
      setGlobalCoins(parseInt(savedCoins));
    }

    const handleCoinsUpdated = (e: any) => {
      if (e.detail !== undefined) {
        setGlobalCoins(e.detail);
      }
    };
    window.addEventListener("coffee-coins-updated", handleCoinsUpdated);
    return () => window.removeEventListener("coffee-coins-updated", handleCoinsUpdated);
  }, []);

  // Edit Form state
  const [editName, setEditName] = useState("");
  const [editPlot, setEditPlot] = useState("");
  const [editStoryline, setEditStoryline] = useState("");
  const [editLink, setEditLink] = useState("");
  const [editAvatar, setEditAvatar] = useState("");
  const [editThemeColor, setEditThemeColor] = useState("rose");
  const [editRole, setEditRole] = useState("");
  const [editAge, setEditAge] = useState("");
  const [editGender, setEditGender] = useState("");
  const [editHeight, setEditHeight] = useState("");
  const [editOccupation, setEditOccupation] = useState("");
  const [editRelationship, setEditRelationship] = useState("");
  const [editPronouns, setEditPronouns] = useState("");
  const [editZodiac, setEditZodiac] = useState("");
  const [editMbti, setEditMbti] = useState("");
  const [editBirthday, setEditBirthday] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editCategory, setEditCategory] = useState("");

  // Add character form state
  const [newCharName, setNewCharName] = useState("");
  const [newCharPlot, setNewCharPlot] = useState("");
  const [newCharStoryline, setNewCharStoryline] = useState("");
  const [newCharLink, setNewCharLink] = useState("");
  const [newCharAvatar, setNewCharAvatar] = useState("👤");
  const [newCharTheme, setNewCharTheme] = useState("rose");
  const [newCharBirthday, setNewCharBirthday] = useState("");

  // Feedback form state
  const [feedbackAuthor, setFeedbackAuthor] = useState("");
  const [feedbackContent, setFeedbackContent] = useState("");
  const [feedbackRating, setFeedbackRating] = useState("❤️");
  const [feedbackStarRating, setFeedbackStarRating] = useState<number>(5);
  const [replyingToFeedbackId, setReplyingToFeedbackId] = useState<string | null>(null);
  const [adminReplyContent, setAdminReplyContent] = useState<string>("");
  const [feedbackAvatar, setFeedbackAvatar] = useState("🌸");

  // Support posts unread notification state
  const [hasNewSupportPost, setHasNewSupportPost] = useState(false);

  useEffect(() => {
    const unsubSupport = onSnapshot(
      query(collection(db, "support_posts"), orderBy("timestamp", "desc"), limit(1)),
      (snapshot) => {
        if (!snapshot.empty) {
          const latestPost = snapshot.docs[0].data();
          const latestPostTime = new Date(latestPost.timestamp).getTime();
          const lastViewedTimeStr = localStorage.getItem("meomeo_last_viewed_support_time");
          if (lastViewedTimeStr) {
             if (latestPostTime > parseInt(lastViewedTimeStr)) {
                setHasNewSupportPost(true);
             } else {
                setHasNewSupportPost(false);
             }
          } else {
             setHasNewSupportPost(true);
          }
        }
      },
      (err) => console.error("Error listening to support posts:", err)
    );
    return () => unsubSupport();
  }, []);

  // Load characters and secret comments from server, with localStorage fallback
  useEffect(() => {
    let isInitialChars = true;
    const unsubChars = onSnapshot(collection(db, "posts"), (snapshot) => {
      const localFavs = JSON.parse(localStorage.getItem("meomeo_favorites") || "[]");
      if (snapshot.empty && isInitialChars) {
        // Migrate from localStorage
        const saved = localStorage.getItem("portal_characters_v11");
        let rawList = DEFAULT_CHARACTERS;
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (Array.isArray(parsed)) {
              rawList = parsed.filter((item: any) => item && item.id);
            }
          } catch (e) {}
        }
        
        const existingIds = new Set(rawList.filter(c => c && c.id).map((c: any) => c.id));
        const missingDefaults = DEFAULT_CHARACTERS.filter(d => d && d.id && !existingIds.has(d.id));
        const fullList = [...rawList.filter(c => c && c.id), ...missingDefaults];

        fullList.forEach(char => {
          if (char && char.id) {
            setDoc(doc(db, "posts", char.id), char, { merge: true });
          }
        });
        
        const finalMapped = fullList.map(enrichCharacter).map((c: any) => ({ ...c, isFavorite: c?.id ? localFavs.includes(c.id) : false }));
        setCharacters(finalMapped);
        localStorage.setItem("portal_characters_v11", safeJsonStringify(finalMapped));
      } else {
        const postsData = snapshot.docs.map(doc => {
          const data = doc.data() as Character;
          if (data) {
            data.id = data.id || doc.id;
            data.isFavorite = localFavs.includes(data.id);
          }
          return data;
        }).filter(Boolean) as Character[];

        // Merge any missing default characters and push to Firestore
        if (isInitialChars) {
          const existingIds = new Set(postsData.map(c => c?.id).filter(Boolean));
          const missingDefaults = DEFAULT_CHARACTERS.filter(d => d && d.id && !existingIds.has(d.id));
          missingDefaults.forEach(char => {
            setDoc(doc(db, "posts", char.id), char, { merge: true });
            postsData.push({ ...char, isFavorite: localFavs.includes(char.id) });
          });

          // No automatic overwrite of character fields to allow Admin editing to persist
        }

        const enrichedPosts = postsData.map(enrichCharacter);
        setCharacters(enrichedPosts);
        localStorage.setItem("portal_characters_v11", safeJsonStringify(enrichedPosts));
      }
      isInitialChars = false;
    });

    let isInitialComments = true;
    const unsubComments = onSnapshot(collection(db, "secretComments"), (snapshot) => {
      if (snapshot.empty && isInitialComments) {
        const saved = localStorage.getItem("meomeo_secret_comments");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const filtered = (parsed || []).filter((c: any) => c && c.id);
            filtered.forEach((c: SecretComment) => {
              setDoc(doc(db, "secretComments", c.id), c);
            });
            setSecretComments(filtered);
            localStorage.setItem("meomeo_secret_comments", safeJsonStringify(filtered));
          } catch(e) {}
        }
      } else {
        const commentsData = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }) as SecretComment)
          .sort((a, b) => b.id.localeCompare(a.id));
        setSecretComments(commentsData);
        localStorage.setItem("meomeo_secret_comments", safeJsonStringify(commentsData));
      }
      isInitialComments = false;
    }, (err) => console.error("Error listening to secretComments:", err));

    let isInitialBotFeedbacks = true;
    const unsubBotFeedbacks = onSnapshot(collection(db, "botFeedbacks"), (snapshot) => {
      if (snapshot.empty && isInitialBotFeedbacks) {
        const saved = localStorage.getItem("meomeo_bot_feedbacks");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            const filtered = (parsed || []).filter((f: any) => f && f.id);
            filtered.forEach((f: any) => {
              setDoc(doc(db, "botFeedbacks", f.id), f);
            });
            setBotFeedbacks(filtered);
            localStorage.setItem("meomeo_bot_feedbacks", safeJsonStringify(filtered));
          } catch(e) {}
        }
      } else {
        const fbs = snapshot.docs
          .map(d => ({ id: d.id, ...d.data() }) as BotFeedbackItem)
          .sort((a, b) => b.id.localeCompare(a.id));
        setBotFeedbacks(fbs);
        localStorage.setItem("meomeo_bot_feedbacks", safeJsonStringify(fbs));
      }
      isInitialBotFeedbacks = false;
    }, (err) => console.error("Error listening to botFeedbacks:", err));

    const unsubHearts = onSnapshot(doc(db, "hearts", "main"), (d) => {
      if (d.exists()) {
        const c = d.data().count || 0;
        setHeartTotal(c);
        localStorage.setItem("meomeo_heart_total", String(c));
      } else {
        const saved = localStorage.getItem("meomeo_heart_total");
        if (saved) {
          setDoc(doc(db, "hearts", "main"), { count: parseInt(saved) || 0 });
        }
      }
    });

    return () => {
      unsubChars();
      unsubComments();
      unsubBotFeedbacks();
      unsubHearts();
    };
  }, []);

  // Save characters helper is no longer needed

  // Populate Edit Fields when selected character changes or Edit Mode is entered
  useEffect(() => {
    if (selectedCharacter) {
      setEditName(selectedCharacter.name || "");
      setEditPlot(selectedCharacter.plot || "");
      setEditStoryline(selectedCharacter.storyline || "");
      setEditLink(selectedCharacter.link || "");
      setEditAvatar(selectedCharacter.avatar || "");
      setEditThemeColor(selectedCharacter.themeColor || "rose");
      setEditRole(selectedCharacter.role || "");
      setEditAge(selectedCharacter.age || "");
      setEditGender(selectedCharacter.gender || "");
      setEditHeight(selectedCharacter.height || "");
      setEditOccupation(selectedCharacter.occupation || "");
      setEditRelationship(selectedCharacter.relationship || "");
      setEditPronouns(selectedCharacter.pronouns || "");
      setEditZodiac(selectedCharacter.zodiac || "");
      setEditMbti(selectedCharacter.mbti || "");
      setEditBirthday(selectedCharacter.birthday || "");
      setEditNote(selectedCharacter.note || "");
      setEditCategory(selectedCharacter.category || "");
    } else {
      setIsEditMode(false);
    }
  }, [selectedCharacter, isEditMode]);

  // Keep selectedCharacter synced with latest characters state (e.g. for real-time comments)
  useEffect(() => {
    if (selectedCharacter) {
      const updated = characters.find(c => c && c.id === selectedCharacter.id);
      if (updated && safeJsonStringify(updated) !== safeJsonStringify(selectedCharacter)) {
        setSelectedCharacter(updated);
      }
    }
  }, [characters, selectedCharacter]);

  // Handle scroll progress and scrollbar detection for storyline modal
  useEffect(() => {
    if (selectedCharacter && !isEditMode) {
      const timer = setTimeout(() => {
        const el = document.getElementById("storyline-text");
        if (el) {
          setHasStoryScrollbar(el.scrollHeight > el.clientHeight);
        }
      }, 150);
      return () => clearTimeout(timer);
    } else {
      setHasStoryScrollbar(false);
      setStoryScrollProgress(0);
    }
  }, [selectedCharacter, isEditMode, selectedCharacter?.storyline]);

  // Handle Adding Character
  const handleAddCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserEmail !== "nguyenthao19876.64@gmail.com") {
      alert("Bạn không có quyền thêm nhân vật!");
      return;
    }
    if (!newCharName.trim() || !newCharLink.trim()) {
      alert("Vui lòng điền đầy đủ Tên nhân vật và Đường dẫn liên kết!");
      return;
    }

    let formattedLink = newCharLink.trim();
    if (!/^https?:\/\//i.test(formattedLink)) {
      formattedLink = "https://" + formattedLink;
    }

    const newChar: Character = enrichCharacter({
      id: "char_" + Date.now(),
      name: newCharName.trim(),
      plot: newCharPlot.trim() || "Chưa có tóm tắt cốt truyện.",
      storyline: newCharStoryline.trim() || "Chưa có cốt truyện chi tiết.",
      link: formattedLink,
      avatar: newCharAvatar.trim() || "👤",
      themeColor: newCharTheme,
      birthday: newCharBirthday.trim(),
      isCustom: true,
      views: 0
    });

    const updated = [newChar, ...characters];
    setDoc(doc(db, "posts", newChar.id), newChar, { merge: true });

    // Trigger confetti celebration
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 }
    });

    // Reset Form
    setNewCharName("");
    setNewCharPlot("");
    setNewCharStoryline("");
    setNewCharLink("");
    setNewCharAvatar("👤");
    setNewCharTheme("rose");
    setNewCharBirthday("");
    
    setIsAddModalOpen(false);
  };

  // Handle Editing Selected Character
  const handleUpdateCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUserEmail !== "nguyenthao19876.64@gmail.com") {
      alert("Bạn không có quyền chỉnh sửa hồ sơ nhân vật!");
      return;
    }
    if (!selectedCharacter || !selectedCharacter.id) return;
    if (!editName.trim() || !editLink.trim()) {
      alert("Tên nhân vật và Đường dẫn liên kết không được để trống!");
      return;
    }

    let formattedLink = editLink.trim();
    if (!/^https?:\/\//i.test(formattedLink)) {
      formattedLink = "https://" + formattedLink;
    }

    const updatedChar: Character = enrichCharacter({
      ...selectedCharacter,
      name: editName.trim(),
      plot: editPlot.trim(),
      storyline: editStoryline.trim(),
      link: formattedLink,
      avatar: editAvatar.trim() || "👤",
      themeColor: editThemeColor,
      role: editRole.trim(),
      age: editAge.trim(),
      gender: editGender.trim(),
      height: editHeight.trim(),
      occupation: editOccupation.trim(),
      relationship: editRelationship.trim(),
      pronouns: editPronouns.trim(),
      zodiac: editZodiac.trim(),
      mbti: editMbti.trim(),
      birthday: editBirthday.trim(),
      note: editNote.trim(),
      category: editCategory.trim(),
    });

    const updatedList = characters.map(c => c && c.id === selectedCharacter.id ? updatedChar : c);
    setDoc(doc(db, "posts", updatedChar.id), updatedChar, { merge: true });
    setSelectedCharacter(updatedChar);
    setIsEditMode(false);
  };

  // Handle Deleting Character
  const handleDeleteCharacter = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (currentUserEmail !== "nguyenthao19876.64@gmail.com") {
      alert("Bạn không có quyền xóa nhân vật!");
      return;
    }
    if (confirm("Bạn có chắc chắn muốn xóa nhân vật này khỏi vũ trụ?")) {
      deleteDoc(doc(db, "posts", id));
      if (selectedCharacter?.id === id) {
        setSelectedCharacter(null);
      }
    }
  };

  // Handle Adding Feedback
  const handleAddFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCharacter || !selectedCharacter.id) return;
    if (!feedbackContent.trim()) return;

    const newFeedback = {
      id: "fb_" + Date.now(),
      author: feedbackAuthor.trim() || "Ẩn danh",
      content: feedbackContent.trim(),
      timestamp: new Date().toLocaleString("vi-VN"),
      rating: feedbackRating,
      avatar: feedbackAvatar,
      starRating: feedbackStarRating
    };

    const updatedFeedbacks = [...(selectedCharacter.feedbacks || []), newFeedback];
    const updatedCharacter = { ...selectedCharacter, feedbacks: updatedFeedbacks };
    
    const updatedList = characters.map(c => c && c.id === selectedCharacter.id ? updatedCharacter : c);
    
    setCharacters(updatedList);
    setSelectedCharacter(updatedCharacter);

    // Save to Firestore with setDoc merge to create document if it doesn't exist yet
    setDoc(doc(db, "posts", selectedCharacter.id), { feedbacks: updatedFeedbacks }, { merge: true }).catch(err => {
      console.error("Error saving feedback to Firestore:", err);
    });

    setFeedbackContent("");
    setFeedbackStarRating(5);
    showToast("Cảm ơn bạn đã để lại bình luận! ❤️");
    playMeowSound();
  };

  // Handle Deleting Feedback
  const handleDeleteFeedback = (feedbackId: string) => {
    if (!selectedCharacter || !selectedCharacter.id) return;
    const updatedFeedbacks = (selectedCharacter.feedbacks || []).filter(fb => fb.id !== feedbackId);
    const updatedCharacter = { ...selectedCharacter, feedbacks: updatedFeedbacks };
    const updatedList = characters.map(c => c && c.id === selectedCharacter.id ? updatedCharacter : c);
    
    setCharacters(updatedList);
    setSelectedCharacter(updatedCharacter);

    setDoc(doc(db, "posts", selectedCharacter.id), { feedbacks: updatedFeedbacks }, { merge: true }).catch(err => {
      console.error("Error deleting feedback from Firestore:", err);
    });

    showToast("Đã xóa bình luận!");
    playMeowSound();
  };


  const handleSaveAdminReply = (feedbackId: string) => {
    if (!selectedCharacter || !selectedCharacter.id) return;
    const updatedFeedbacks = (selectedCharacter.feedbacks || []).map(fb => {
      if (fb.id === feedbackId) {
        return {
          ...fb,
          adminReply: adminReplyContent,
          adminReplyTimestamp: new Date().toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" }) + " " + new Date().toLocaleDateString("vi-VN"),
        };
      }
      return fb;
    });

    const updatedCharacter = { ...selectedCharacter, feedbacks: updatedFeedbacks };
    const updatedList = characters.map(c => c && c.id === selectedCharacter.id ? updatedCharacter : c);
    
    setCharacters(updatedList);
    setSelectedCharacter(updatedCharacter);

    setDoc(doc(db, "posts", selectedCharacter.id), { feedbacks: updatedFeedbacks }, { merge: true }).catch(err => {
      console.error("Error saving admin reply to Firestore:", err);
    });

    setReplyingToFeedbackId(null);
    setAdminReplyContent("");
    showToast("Đã gửi câu trả lời!");
    playMeowSound();
  };

  // Toggle character favorite status
  const handleToggleFavorite = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    playMeowSound();
    const updated = characters.map(c => {
      if (c && c.id === id) {
        const nextFav = !c.isFavorite;
        // Trigger a tiny heart confetti celebration on favoriting
                if (nextFav) {
          confetti({
            particleCount: 50,
            angle: 60,
            spread: 55,
            origin: { x: 0, y: 0.8 },
            colors: ["#f43f5e", "#fda4af", "#fff"]
          });
          confetti({
            particleCount: 50,
            angle: 120,
            spread: 55,
            origin: { x: 1, y: 0.8 },
            colors: ["#f43f5e", "#fda4af", "#fff"]
          });
          showToast(`Đã thêm ${c.name} vào danh sách yêu thích! ❤️`);
        } else {
          showToast(`Đã bỏ ${c.name} khỏi danh sách yêu thích 💔`);
        }
        
        // Update favorites count optimistically
        const newCount = Math.max(0, (c.favoritesCount || 0) + (nextFav ? 1 : -1));
        
        // Sync to Firestore
        setDoc(doc(db, "posts", id), { favoritesCount: increment(nextFav ? 1 : -1) }, { merge: true }).catch(console.error);

        return { ...c, isFavorite: nextFav, favoritesCount: newCount };
      }
      return c;
    });
    setCharacters(updated);
    const favIds = updated.filter(c => c && c.isFavorite).map(c => c.id);
    localStorage.setItem("meomeo_favorites", safeJsonStringify(favIds));

    // If selected character is the one being favorited, update it too
    if (selectedCharacter && selectedCharacter.id === id) {
      setSelectedCharacter(prev => {
        if (!prev) return null;
        const nextFav = !prev.isFavorite;
        return { 
          ...prev, 
          isFavorite: nextFav,
          favoritesCount: Math.max(0, (prev.favoritesCount || 0) + (nextFav ? 1 : -1))
        };
      });
    }
  };

  // Increment view count of a character and select it
  const handleSelectCharacter = (char: Character) => {
    if (!char || !char.id) return;
    if (char.id === "kaven-nyx") {
      setKavenLockedAlertOpen(true);
      return;
    }
    if (char.id === "kaiza-tachibana" || char.id === "tham-da" || char.id === "kanzaki-ren") {
      setAgeVerification("pending");
    } else {
      setAgeVerification("verified"); // Default for other characters
    }

    const todayStr = new Date().toDateString(); // e.g. "Mon Aug 17 2026"
    
    // Quest logic
    try {
      localStorage.setItem(`quest_viewed_profile_${todayStr}`, "true");
    } catch(e) {
      console.error("Lỗi cập nhật quest:", e);
    }

    // Daily tracking logic: Reset local viewed array in localStorage if a new day has arrived.
    // This allows the same user to increment character views on subsequent days (no perpetual "rest" or block),
    // while preventing spam views by refreshing the page continuously within the same day.
    const lastViewedDate = localStorage.getItem("meomeo_last_viewed_date");
    let viewedIds = [];

    if (lastViewedDate !== todayStr) {
      localStorage.setItem("meomeo_last_viewed_date", todayStr);
      localStorage.setItem("meomeo_viewed_characters_v4", safeJsonStringify([]));
      viewedIds = [];
    } else {
      viewedIds = JSON.parse(localStorage.getItem("meomeo_viewed_characters_v4") || "[]");
    }
    
    if (!viewedIds.includes(char.id)) {
      // User hasn't viewed this character today, so we increment the global count in Firestore
      setDoc(doc(db, "posts", char.id), { views: increment(1) }, { merge: true }).catch(console.error);
      
      const updatedViewed = [...viewedIds, char.id];
      localStorage.setItem("meomeo_viewed_characters_v4", safeJsonStringify(updatedViewed));
      
      // Optimistic local update
      const newViews = (char.views || 0) + 1;
      setCharacters(prev => {
        const updated = prev.map(c => c.id === char.id ? { ...c, views: newViews } : c);
        return updated;
      });
      setSelectedCharacter({ ...char, views: newViews });
    } else {
      // Already viewed by this user today, just select it without incrementing again in this session/day
      setSelectedCharacter(char);
    }

    setIsEditMode(false);
  };

  // Select a random character
  const handleRandomCharacter = () => {
    if (characters.length === 0) return;
    const randomIndex = Math.floor(Math.random() * characters.length);
    handleSelectCharacter(characters[randomIndex]);
  };

  // Serve a random character with food-themed animation
  const handleServeDish = () => {
    if (characters.length === 0) return;
    setIsServing(true);
    setServedCharacter(null);
    setServingProgress(0);

    const steps = [
      "Meo Meo đang lau dọn đĩa bạc lấp lánh... 🧼✨",
      "Đang chọn nguyên liệu cốt truyện thơm ngon... 🍓📖",
      "Đang nêm nếm chút si tình ngọt ngào... 🍯💖",
      "Đang hâm nóng nhân vật bằng ngọn lửa siêu kịch tính... 🔥🎬",
      "Món ăn hoàng gia đặc biệt đã sẵn sàng! 👑🍽️"
    ];

    let currentStep = 0;
    setServingMessage(steps[0]);
    setServingProgress(15); // Start at 15% for step 0

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep < steps.length) {
        setServingMessage(steps[currentStep]);
        // Linear increase up to 100%
        const calculatedProgress = 15 + Math.round((currentStep / (steps.length - 1)) * 85);
        setServingProgress(Math.min(calculatedProgress, 100));
      } else {
        clearInterval(interval);
        setServingProgress(100);
        const randomIndex = Math.floor(Math.random() * characters.length);
        setServedCharacter(characters[randomIndex]);
        setIsServing(false);
      }
    }, 450);
  };

  // Filter and search characters
  const filteredCharacters = (() => {
    // 1. First, filter by search query
    let list = characters.filter(char => {
      const query = searchQuery.toLowerCase();
      const matchesSearch = 
        (char.name || "").toLowerCase().includes(query) ||
        (char.role || "").toLowerCase().includes(query) ||
        (char.plot || "").toLowerCase().includes(query) ||
        (char.storyline || "").toLowerCase().includes(query);
      
      return matchesSearch;
    });

    // 1.5 Filter by selectedCategory if it's not "Tất cả"
    if (selectedCategory !== "Tất cả") {
      list = list.filter(char => char.category === selectedCategory);
    }

    // 2. Filter by dropdown selection if it's "favorites"
    if (gridSortFilter === "favorites") {
      list = list.filter(char => !!char.isFavorite);
    }

    // 3. Sort by selection if it is "newest"
    if (gridSortFilter === "newest") {
      list = [...list].sort((a, b) => {
        const getTimestamp = (char: Character) => {
          if (!char || !char.id) return 0;
          if (char.id.startsWith("char_")) {
            const num = parseInt(char.id.replace("char_", ""), 10);
            return isNaN(num) ? 0 : num;
          }
          // Default characters have a lower timestamp, ordered by their position in DEFAULT_CHARACTERS
          const defaultIndex = DEFAULT_CHARACTERS.findIndex(c => c.id === char.id);
          return defaultIndex !== -1 ? 1000000 - defaultIndex : 0;
        };
        return getTimestamp(b) - getTimestamp(a);
      });
    } else if (gridSortFilter === "most_views") {
      list = [...list].sort((a, b) => (b.views || 0) - (a.views || 0));
    }

    return list;
  })();

  const top3Characters = [...characters]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 3);

  // Navigate to Link
  const handleGoToLink = (linkUrl: string) => {
    if (selectedCharacter && (selectedCharacter.id === "kaiza-tachibana" || selectedCharacter.id === "tham-da" || selectedCharacter.id === "kanzaki-ren") && ageVerification === "rejected") {
      return;
    }
    window.open(linkUrl, "_blank", "noopener,noreferrer");
  };

  // Get matching theme details
  const getThemeDetails = (colorValue: string) => {
    const theme = PRESET_THEMES.find(t => t.value === colorValue);
    return theme || PRESET_THEMES[0];
  };

  // Helper to parse hex colors from pageBgLight/pageBgDark classes
  const getPageBgHex = (bgClass: string) => {
    const match = bgClass.match(/#([a-fA-F0-9]{6})/);
    return match ? `#${match[1]}` : "#ffffff";
  };

  return (
    <div 
      style={{ fontFamily: appFont === "Caveat" ? "'Caveat', cursive" : appFont === "Lora" ? "'Lora', serif" : appFont === "Inter" ? "'Inter', sans-serif" : "'Quicksand', sans-serif" }}
      className={`min-h-screen flex flex-col relative overflow-x-hidden transition-colors duration-300 ${currentPastel.selectionBg} ${
        !hasEntered ? "h-screen overflow-hidden" : ""
      } ${
        isDarkMode ? `${currentPastel.pageBgDark} text-stone-200` : `${currentPastel.pageBgLight} text-stone-700`
      }`}
    >
      
      {/* Top scroll progress bar */}
      {hasEntered && (
        <div className="fixed top-0 left-0 right-0 h-[3px] bg-stone-200/20 dark:bg-stone-800/20 z-[100] pointer-events-none">
          <div 
            className={`h-full bg-gradient-to-r ${currentPastel.accentGradient} transition-all duration-150 ease-out`} 
            style={{ width: `${pageScrollProgress}%` }}
          />
        </div>
      )}
      
      {/* Immersive Light Mode Sakura Landscape Background */}
      {!isDarkMode && (
        <div 
          className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-[0.16] pointer-events-none fixed"
          style={{ backgroundImage: `url(${lightSakuraBg})` }}
        />
      )}

      {/* Immersive Dark Mode Deep Pink Sakura Glow Overlay */}
      {isDarkMode && (
        <div className="absolute inset-0 z-0 pointer-events-none fixed">
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.25] pointer-events-none"
            style={{ backgroundImage: `url(${darkSunsetBalconyBg})` }}
          />
          {/* Soft magenta/hot-pink glowing radial gradients in the corners to create a vivid contrast with the dark burgundy base */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,105,180,0.12),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(224,73,114,0.1),transparent_70%)]" />
          {/* Subtle warm rose center vignette */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,114,182,0.03),transparent_80%)]" />
        </div>
      )}

      {/* Foreground subtle falling tiny particle overlay */}
      <ParticleOverlay isDarkMode={isDarkMode} effect={particleEffect} />

      {/* Floating Music Player */}
      {hasEntered && <MusicPlayer isDarkMode={isDarkMode} />}

      {/* Floating System Controls (Bottom Left) */}
      {hasEntered && (
        <div className="fixed bottom-4 left-4 z-50 flex flex-col gap-3">
          {/* Font Settings Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsFontMenuOpen(!isFontMenuOpen);
                playMeowSound();
              }}
              className={`flex items-center justify-center p-3 border rounded-full transition-all duration-300 cursor-pointer shadow-lg hover:scale-105 active:scale-95 ${
                isDarkMode 
                  ? "border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800" 
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
              title="Cài đặt Font chữ"
            >
              <Type className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {isFontMenuOpen && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsFontMenuOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10, x: 0, transformOrigin: "bottom left" }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute left-0 bottom-full mb-3 w-48 rounded-2xl shadow-xl border overflow-hidden z-50 p-2 ${
                      isDarkMode 
                        ? "bg-stone-900 border-stone-800 text-stone-200 shadow-black/50" 
                        : "bg-white border-[#eadbca]/50 text-stone-800 shadow-stone-200/50"
                    }`}
                  >
                    <div className="px-2.5 py-1.5 text-[9px] font-sans font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 border-b border-stone-100 dark:border-stone-800/60 mb-1">
                      Chọn Font Chữ
                    </div>
                    {[
                      { name: "Quicksand (Bo tròn)", value: "Quicksand", style: "'Quicksand', sans-serif" },
                      { name: "Inter (Hiện đại)", value: "Inter", style: "'Inter', sans-serif" },
                      { name: "Lora (Cổ điển)", value: "Lora", style: "'Lora', serif" },
                      { name: "Caveat (Chữ viết)", value: "Caveat", style: "'Caveat', cursive" }
                    ].map((fontOption) => (
                      <button
                        key={fontOption.value}
                        type="button"
                        onClick={() => {
                          setAppFont(fontOption.value as any);
                          localStorage.setItem("meomeo_app_font", fontOption.value);
                          setIsFontMenuOpen(false);
                          showToast(`Đã đổi font chữ sang ${fontOption.value} ✨`);
                        }}
                        style={{ fontFamily: fontOption.style }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-between cursor-pointer ${
                          appFont === fontOption.value
                            ? isDarkMode
                              ? "bg-rose-950/60 text-rose-300 border border-rose-800/50"
                              : "bg-rose-50 text-rose-600 border border-rose-200/60"
                            : isDarkMode
                            ? "hover:bg-stone-800 text-stone-300 border border-transparent"
                            : "hover:bg-rose-50/50 text-stone-700 border border-transparent"
                        }`}
                      >
                        <span>{fontOption.name}</span>
                        {appFont === fontOption.value && (
                          <span className="text-rose-500 text-[10px]">●</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Particle Effects Selector Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsParticleMenuOpen(!isParticleMenuOpen);
                playMeowSound();
              }}
              className={`flex items-center justify-center p-3 border rounded-full transition-all duration-300 cursor-pointer shadow-lg hover:scale-105 active:scale-95 ${
                isDarkMode 
                  ? "border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800" 
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
              title="Cấu hình hiệu ứng rơi"
            >
              <Sparkles className="w-5 h-5 text-rose-400 animate-pulse" />
            </button>

            <AnimatePresence>
              {isParticleMenuOpen && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsParticleMenuOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10, x: 0, transformOrigin: "bottom left" }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute left-0 bottom-full mb-3 w-56 rounded-2xl shadow-xl border overflow-hidden z-50 p-2 ${
                      isDarkMode 
                        ? "bg-stone-900 border-stone-800 text-stone-200 shadow-black/50" 
                        : "bg-white border-[#eadbca]/50 text-stone-800 shadow-stone-200/50"
                    }`}
                  >
                    <div className="px-2.5 py-1.5 text-[9px] font-sans font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 border-b border-stone-100 dark:border-stone-800/60 mb-1 flex items-center justify-between">
                      <span>Hiệu Ứng Rơi</span>
                      <span className="text-[10px]">✨🌸</span>
                    </div>

                    {/* Weak Device Optimization / Disable Effects Toggle Bar */}
                    <div className="px-2 py-2 mb-2 border-b border-stone-100 dark:border-stone-800/60 bg-stone-50/30 dark:bg-stone-800/10 rounded-xl">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-stone-500 dark:text-stone-400 flex items-center gap-1.5">
                          🚫 Tắt hiệu ứng (Tối ưu)
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            playMeowSound();
                            if (particleEffect !== "none") {
                              setParticleEffect("none");
                              localStorage.setItem("meomeo_particle_effect", "none");
                              showToast("Đã tắt hiệu ứng rơi để tối ưu hiệu năng! 🚫⚡");
                            } else {
                              setParticleEffect("cherry_blossom");
                              localStorage.setItem("meomeo_particle_effect", "cherry_blossom");
                              showToast("Đã bật lại hiệu ứng rơi! ✨🌸");
                            }
                          }}
                          className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 cursor-pointer ${
                            particleEffect === "none" ? "bg-rose-500" : "bg-stone-300 dark:bg-stone-700"
                          }`}
                        >
                          <div
                            className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm transform transition-transform duration-200 ${
                              particleEffect === "none" ? "translate-x-3.5" : "translate-x-0"
                            }`}
                          />
                        </button>
                      </div>
                      <p className="text-[9px] text-stone-400 dark:text-stone-500 mt-1 leading-normal font-medium">
                        Giảm lag và tối ưu giao diện cực mượt dành cho người dùng máy yếu ⚡
                      </p>
                    </div>

                    {[
                      { name: "Tắt hiệu ứng 🚫", value: "none" },
                      { name: "Hoa anh đào rơi 🌸", value: "cherry_blossom" },
                      { name: "Tuyết rơi li ti ❄️", value: "snow" },
                      { name: "Dấu chân mèo rơi 🐾", value: "cat_paw" },
                      { name: "Trái tim lãng mạn ❤️", value: "heart" },
                      { name: "Ngôi sao lấp lánh ⭐", value: "star" },
                      { name: "Bong bóng xà phòng 🫧", value: "bubbles" },
                      { name: "Lá mùa thu bay 🍁", value: "autumn_leaves" }
                    ].map((effectOption) => (
                      <button
                        key={effectOption.value}
                        type="button"
                        onClick={() => {
                          setParticleEffect(effectOption.value);
                          localStorage.setItem("meomeo_particle_effect", effectOption.value);
                          setIsParticleMenuOpen(false);
                          if (effectOption.value === "none") {
                            showToast("Đã tắt hiệu ứng rơi để tối ưu hiệu năng! 🚫⚡");
                          } else {
                            showToast(`Đã đổi hiệu ứng sang: ${effectOption.name.split(" ")[0]} ✨`);
                          }
                        }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-between cursor-pointer ${
                          particleEffect === effectOption.value
                            ? isDarkMode
                              ? "bg-rose-950/60 text-rose-300 border border-rose-800/50"
                              : "bg-rose-50 text-rose-600 border border-rose-200/60"
                            : isDarkMode
                            ? "hover:bg-stone-800 text-stone-300 border border-transparent"
                            : "hover:bg-rose-50/50 text-stone-700 border border-transparent"
                        }`}
                      >
                        <span>{effectOption.name}</span>
                        {particleEffect === effectOption.value && (
                          <span className="text-rose-500 text-[10px]">●</span>
                        )}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Pastel Color Theme Selector Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                setIsThemeMenuOpen(!isThemeMenuOpen);
                playMeowSound();
              }}
              className={`flex items-center justify-center p-3 border rounded-full transition-all duration-300 cursor-pointer shadow-lg hover:scale-105 active:scale-95 ${
                isDarkMode 
                  ? "border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800" 
                  : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
              }`}
              title="Cài đặt chủ đề màu sắc"
            >
              <Palette className={`w-5 h-5 ${currentPastel.primaryText}`} />
            </button>

            <AnimatePresence>
              {isThemeMenuOpen && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsThemeMenuOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: 10, x: 0, transformOrigin: "bottom left" }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    transition={{ duration: 0.15 }}
                    className={`absolute left-0 bottom-full mb-3 w-56 rounded-2xl shadow-xl border overflow-hidden z-50 p-2 ${
                      isDarkMode 
                        ? "bg-stone-900 border-stone-800 text-stone-200 shadow-black/50" 
                        : "bg-white border-[#eadbca]/50 text-stone-800 shadow-stone-200/50"
                    }`}
                  >
                    <div className="px-2.5 py-1.5 text-[9px] font-sans font-bold uppercase tracking-widest text-stone-400 dark:text-stone-500 border-b border-stone-100 dark:border-stone-800/60 mb-1 flex items-center justify-between">
                      <span>Chủ Đề Màu Sắc</span>
                      <span className="text-[10px]">🎨🌈</span>
                    </div>

                    <div className="max-h-60 overflow-y-auto pr-1 space-y-0.5 scrollbar-thin">
                      {Object.values(PASTEL_WEB_THEMES).map((theme) => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => {
                            setSitePastelTheme(theme.id);
                            localStorage.setItem("meomeo_site_pastel_theme", theme.id);
                            setIsThemeMenuOpen(false);
                            showToast(`Đã đổi chủ đề sang màu ${theme.name} ${theme.icon} ✨`);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center justify-between cursor-pointer ${
                            sitePastelTheme === theme.id
                              ? isDarkMode
                                ? "bg-stone-800 text-stone-100 border border-stone-700"
                                : `${theme.primaryBgLight} ${theme.primaryText} border ${theme.primaryBorderLight}`
                              : isDarkMode
                              ? "hover:bg-stone-800 text-stone-300 border border-transparent"
                              : "hover:bg-rose-50/50 text-stone-700 border border-transparent"
                          }`}
                        >
                          <span className="flex items-center gap-2">
                            <span className="text-sm">{theme.icon}</span>
                            <span>{theme.name}</span>
                          </span>
                          {sitePastelTheme === theme.id && (
                            <span className="text-rose-500 text-[10px]">●</span>
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Lag Reduction Toggle Button */}
          <button
            onClick={() => {
              const newLagState = !isLagReduced;
              setIsLagReduced(newLagState);
              localStorage.setItem("meomeo_lag_reduced", String(newLagState));
              playMeowSound();
              if (newLagState) {
                setParticleEffect("none");
                localStorage.setItem("meomeo_particle_effect", "none");
                setIncomingNoti(null);
                showToast("Đã bật Chế Độ Giảm Lag! Tắt toàn bộ thông báo tin nhắn nhân vật ⚡🚀");
              } else {
                setParticleEffect("cherry_blossom");
                localStorage.setItem("meomeo_particle_effect", "cherry_blossom");
                showToast("Đã tắt Chế Độ Giảm Lag! Bật lại đầy đủ hiệu ứng & thông báo tin nhắn ✨");
              }
            }}
            className={`flex items-center justify-center p-3 border rounded-full transition-all duration-300 cursor-pointer shadow-lg hover:scale-105 active:scale-95 gap-1.5 ${
              isLagReduced
                ? "border-amber-500 bg-amber-500/20 text-amber-500 hover:bg-amber-500/30"
                : isDarkMode
                ? "border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800"
                : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
            }`}
            title={isLagReduced ? "Tắt chế độ giảm lag (Bật lại hiệu ứng)" : "Bật chế độ giảm lag (Tối ưu cho máy yếu)"}
          >
            <Zap className={`w-5 h-5 ${isLagReduced ? "animate-pulse fill-amber-500" : ""}`} />
            <span className="text-[10px] font-bold font-mono hidden md:inline">
              {isLagReduced ? "GIẢM LAG: BẬT" : "GIẢM LAG"}
            </span>
          </button>

          {/* Theme Toggle Button */}
          <button
            onClick={() => {
              setIsDarkMode(!isDarkMode);
              playMeowSound();
            }}
            className={`flex items-center justify-center p-3 border rounded-full transition-all duration-300 cursor-pointer shadow-lg hover:scale-105 active:scale-95 ${
              isDarkMode 
                ? "border-stone-700 bg-stone-900 text-stone-300 hover:bg-stone-800" 
                : "border-stone-200 bg-white text-stone-600 hover:bg-stone-50"
            }`}
            title={isDarkMode ? "Chuyển sang nền sáng" : "Chuyển sang nền tối"}
          >
            {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
        </div>
      )}

      {/* Welcome / Entry Loading Screen */}
      <AnimatePresence>
        {!hasEntered && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ 
              opacity: 0,
              scale: 1.08,
              filter: "blur(12px)",
              transition: { duration: 0.55, ease: "easeInOut" }
            }}
            onClick={() => {
              if (loadingProgress < 100) return;
              playMeowSound();
              confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.7 },
                colors: ["#f43f5e", "#fda4af", "#ffffff", "#fb7185", "#fbbf24"]
              });
              setHasEntered(true);
              sessionStorage.setItem("hasEntered", "true");
            }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
          >
            {/* Immersive Background matching active theme mode */}
            {isDarkMode ? (
              <div className="absolute inset-0 transition-all duration-500">
                <div className="absolute inset-0 bg-stone-950" />
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.38] pointer-events-none"
                  style={{ backgroundImage: `url(${darkSunsetBalconyBg})` }}
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,105,180,0.15),transparent_60%),radial-gradient(circle_at_bottom_left,rgba(224,73,114,0.12),transparent_70%)]" />
              </div>
            ) : (
              <div className="absolute inset-0 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-b from-[#ffeef2] via-[#ffdcd3] to-[#ffeef2]" />
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-[0.3] pointer-events-none"
                  style={{ backgroundImage: `url(${lightSakuraBg})` }}
                />
              </div>
            )}

            {/* Glowing orbs - Only in Light Mode */}
            {!isDarkMode && (
              <>
                <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-rose-400/10 blur-3xl animate-pulse pointer-events-none" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-amber-400/10 blur-3xl animate-pulse pointer-events-none" />

                {/* Immersive animated background highlights */}
                <motion.div 
                  className="absolute inset-0 opacity-40 mix-blend-screen pointer-events-none"
                  animate={{
                    background: [
                      "radial-gradient(circle at 20% 30%, rgba(244,63,94,0.15) 0%, transparent 60%)",
                      "radial-gradient(circle at 80% 70%, rgba(251,191,36,0.15) 0%, transparent 60%)",
                      "radial-gradient(circle at 20% 30%, rgba(244,63,94,0.15) 0%, transparent 60%)",
                    ]
                  }}
                  transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
                />
              </>
            )}

            {/* Decorative Grid Lines - Beautiful White Square Grid */}
            <div className={`absolute inset-0 pointer-events-none transition-all duration-300 ${
              isDarkMode
                ? "bg-[linear-gradient(to_right,rgba(255,255,255,0.06)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.06)_1px,transparent_1px)]"
                : "bg-[linear-gradient(to_right,rgba(255,255,255,0.65)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.65)_1px,transparent_1px)]"
            } bg-[size:2.5rem_2.5rem]`} />

            {/* Falling Sparks & Magic Dust */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {loadingSparkles.map((p) => {
                let pathD = "M10 0 L13 7 L20 10 L13 13 L10 20 L7 13 L0 10 L7 7 Z"; // default star
                let viewBox = "0 0 20 20";
                
                if (p.type === "diamond") {
                  pathD = "M10 0 L20 10 L10 20 L0 10 Z";
                  viewBox = "0 0 20 20";
                } else if (p.type === "heart") {
                  pathD = "M12 21.35 l-1.45-1.32 C5.4 15.36 2 12.28 2 8.5 C2 5.42 4.42 3 7.5 3 c1.74 0 3.41 .81 4.5 2.09 C13.09 3.81 14.76 3 16.5 3 C19.58 3 22 5.42 22 8.5 c0 3.78-3.4 6.86-8.55 11.54 L12 21.35 z";
                  viewBox = "0 0 24 24";
                } else if (p.type === "sparkle") {
                  pathD = "M12 2 C12 7.5 16.5 12 22 12 C16.5 12 12 16.5 12 22 C12 16.5 7.5 12 2 12 C7.5 12 12 7.5 12 2 Z";
                  viewBox = "0 0 24 24";
                }
                
                return (
                  <motion.div
                    key={p.id}
                    className="absolute"
                    style={{
                      left: p.left,
                      width: p.size,
                      height: p.size,
                      top: -40,
                    }}
                    initial={{ y: "-10vh", opacity: 0, rotate: 0 }}
                    animate={{
                      y: "115vh",
                      x: p.drift,
                      opacity: [0, 0.9, 0.9, 0],
                      rotate: [0, 360],
                    }}
                    transition={{
                      duration: p.duration,
                      repeat: Infinity,
                      delay: p.delay,
                      ease: "linear",
                    }}
                  >
                    <svg viewBox={viewBox} fill={p.color} className="w-full h-full drop-shadow-[0_0_10px_rgba(255,255,255,0.7)]">
                      <path d={pathD} />
                    </svg>
                  </motion.div>
                );
              })}
            </div>

            {/* Floating footprints to guide the eye */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {welcomeFootprints.map((p) => (
                <motion.div
                  key={p.id}
                  initial={{ 
                    opacity: 0.15, 
                    scale: 0.6, 
                    x: p.x, 
                    y: p.y,
                    rotate: p.rotate
                  }}
                  animate={{
                    y: [0, -30, 0],
                    rotate: [0, 5, 0],
                    opacity: [0.15, 0.4, 0.15]
                  }}
                  transition={{
                    duration: p.duration,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className={`absolute ${
                    p.id === 0 ? "top-10 left-10" :
                    p.id === 1 ? "bottom-20 left-1/4" :
                    p.id === 2 ? "top-1/3 right-12" :
                    p.id === 3 ? "bottom-1/3 left-12" :
                    p.id === 4 ? "top-1/4 right-1/3" : "bottom-12 right-24"
                  }`}
                >
                  <PawPrint className={`w-8 h-8 ${isDarkMode ? "text-rose-950/40" : "text-rose-100/50"}`} />
                </motion.div>
              ))}
            </div>

            {/* Glass Container */}
            <motion.div
              initial={{ opacity: 0, y: 35, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.15, duration: 0.65, ease: "easeOut" }}
              className={`max-w-md w-11/12 p-6 sm:p-8 rounded-3xl border text-center relative z-10 backdrop-blur-xl shadow-2xl transition-colors duration-500 flex flex-col items-center gap-5 sm:gap-6 ${
                isDarkMode 
                  ? "bg-stone-900/50 border-stone-800/80 shadow-rose-950/10" 
                  : "bg-white/60 border-[#eadbca]/50 shadow-rose-100/30"
              }`}
            >
              {/* Outer pulsing ring */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-rose-500/20 blur-xl animate-ping" />
                
                <AnimatePresence>
                  {avatarClickMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 12, scale: 0.85, x: "-50%" }}
                      animate={{ opacity: 1, y: 0, scale: 1, x: "-50%" }}
                      exit={{ opacity: 0, y: -12, scale: 0.85, x: "-50%" }}
                      transition={{ type: "spring", stiffness: 350, damping: 20 }}
                      className="absolute bottom-[115%] left-1/2 -translate-x-1/2 z-50 w-[260px] max-w-[85vw] bg-rose-500 text-white text-xs sm:text-sm font-bold py-2.5 px-4 rounded-2xl shadow-xl shadow-rose-500/30 border-2 border-rose-400/40 flex items-center justify-center text-center gap-1.5 whitespace-normal break-words"
                    >
                      <span>💬 {avatarClickMessage}</span>
                      <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-2.5 h-2.5 bg-rose-500 rotate-45 border-r border-b border-rose-400/20" />
                    </motion.div>
                  )}
                </AnimatePresence>

                <motion.div 
                  whileHover={{ 
                    scale: 1.12, 
                    rotate: 6,
                    boxShadow: "0 10px 25px -5px rgba(244, 63, 94, 0.4)"
                  }}
                  whileTap={{ scale: 0.93 }}
                  animate={{
                    scale: [1, 1.06, 0.98, 1.06, 1],
                  }}
                  transition={{
                    scale: {
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeInOut"
                    },
                    type: "spring",
                    stiffness: 300,
                    damping: 15
                  }}
                  onClick={(e) => {
                    e.stopPropagation(); // Ngăn cản sự kiện kích hoạt vào thẳng trang web
                    playMeowSound();
                    if (loadingProgress === 100) {
                      setAvatarClickMessage("Bot nhà Aeni không ngon hãy quýnh mung");
                    } else {
                      showToast("Bot không ngon miệng hãy tét mung chủ quán, xia xìa");
                    }
                  }}
                  className={`w-24 h-24 rounded-full border-4 border-white shadow-xl cursor-pointer select-none overflow-hidden bg-white flex items-center justify-center shrink-0`}
                >
                  <img 
                    src={formatImageUrl("https://drive.google.com/file/d/1McMqjSLDTK6-D7Kf3VPFIET7mwx3MeVt/view?usp=drivesdk")} 
                    alt="Người Lười Tạo Bot Avatar" 
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover rounded-full transition-transform duration-300"
                  />
                </motion.div>
                
                {/* Micro Sparkles */}
                <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-amber-400 animate-bounce" />
                <Heart className="absolute -bottom-1 -left-1 w-4 h-4 text-rose-400 animate-pulse" />
              </div>

              {/* Title Block */}
              <div className="space-y-2.5">
                <span className={`text-[10px] uppercase tracking-[0.3em] ${currentPastel.primaryText} font-bold font-mono`}>
                  FB: Người Lười Tạo Bot
                </span>
                <h2 className={`text-2xl sm:text-3xl font-serif font-semibold tracking-tight transition-colors duration-300 ${
                  isDarkMode ? "text-stone-100" : "text-stone-800"
                }`}>
                  Món Ăn Tại Đây
                </h2>
                <p className={`text-xs sm:text-sm max-w-xs mx-auto transition-colors duration-300 ${
                  isDarkMode ? "text-stone-400" : "text-stone-500"
                }`}>
                  Mới thưởng thức món ăn. Chúc ngon miệng hehe
                </p>
              </div>

              {/* Loader bars */}
              <div className="w-full space-y-2">
                <div className={`h-1.5 w-full rounded-full overflow-hidden relative ${
                  isDarkMode ? "bg-stone-800" : "bg-stone-100"
                }`}>
                  <div 
                    style={{ 
                      width: `${loadingProgress}%`,
                      willChange: "width" 
                    }}
                    className={`h-full rounded-full transition-all duration-150 ease-out ${
                      isDarkMode ? "bg-stone-500" : "bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300"
                    }`}
                  />
                </div>
                <div className="flex items-center justify-between text-[10.5px] sm:text-xs font-mono opacity-70">
                  <span>{loadingProgress < 100 ? "ĐANG TẢI HỆ THỐNG..." : "HỆ THỐNG ĐÃ SẴN SÀNG"}</span>
                  <span>{loadingProgress}%</span>
                </div>
              </div>

              {/* Call to action button */}
              <motion.div
                animate={loadingProgress === 100 ? { scale: [1, 1.03, 1] } : {}}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                className={`w-full py-3.5 px-6 rounded-2xl font-serif font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2 border shadow-sm ${
                  loadingProgress < 100
                    ? (isDarkMode ? "bg-stone-900/40 text-stone-600 border-stone-800 cursor-not-allowed" : "bg-stone-50 text-stone-400 border-stone-200 cursor-not-allowed")
                    : (isDarkMode
                        ? `${currentPastel.primaryBgDark} ${currentPastel.primaryText} ${currentPastel.primaryBorderDark} hover:bg-stone-900`
                        : `${currentPastel.primaryBgLight} ${currentPastel.primaryText} ${currentPastel.primaryBorderLight} hover:opacity-90`)
                }`}
              >
                <span>{loadingProgress < 100 ? `🐾 Đang bày biện bàn ăn... (${loadingProgress}%) 🐾` : "🐾 Nhấp vào đây nè , meo meo 🐾"}</span>
              </motion.div>
            </motion.div>

            {/* Subtle disclaimer in footer */}
            <span className="absolute bottom-6 text-[10px] tracking-wide opacity-40 font-serif">
              meomeokitty • Kính coong!
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative starry ambient background with dynamic pastel glow */}
      {!isLagReduced && <CatPawsBackground />}
      {!isLagReduced && <div className={`absolute inset-0 pointer-events-none transition-all duration-700 ${currentPastel.glow}`} />}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(231,212,194,0.15)_1px,transparent_1px),linear-gradient(to_bottom,rgba(231,212,194,0.15)_1px,transparent_1px)] bg-[size:3rem_3rem] pointer-events-none" />

      {/* Top Header / Portal Navbar */}
      <header 
        style={{
          backgroundColor: isDarkMode 
            ? `${getPageBgHex(currentPastel.pageBgDark)}ec` // 92.5% opacity
            : `${getPageBgHex(currentPastel.pageBgLight)}f2` // 95% opacity
        }}
        className={`border-b sticky top-0 backdrop-blur-md z-40 px-4 sm:px-12 py-3.5 flex justify-between items-center shadow-sm transition-all duration-300 ${
          isDarkMode 
            ? "border-stone-800/60 text-stone-100 shadow-stone-950/40" 
            : `${currentPastel.primaryBorderLight}/50 text-stone-800 shadow-stone-100/40`
        }`}
      >
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 rounded-full border flex items-center justify-center shadow-inner transition-colors duration-300 overflow-hidden shrink-0 ${
            isDarkMode ? `border-stone-800 ${currentPastel.primaryBgDark}` : `${currentPastel.primaryBorderLight} ${currentPastel.primaryBgLight}`
          }`}>
            <img 
              src="https://i.pinimg.com/736x/71/12/9c/71129cede910df9393dcdc871cb76a10.jpg" 
              alt="meomeokitty" 
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="flex flex-col">
            <div className={`text-base font-serif italic font-semibold tracking-wider transition-colors duration-300 ${
              isDarkMode ? "text-stone-100" : "text-stone-800"
            }`}>
              meomeokitty
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  playMeowSound();
                  setIsDonateModalOpen(true);
                }}
                className={`mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 group shrink-0 ${
                  isDarkMode
                    ? "bg-rose-950/60 border-rose-800/80 text-rose-300 hover:bg-rose-900/70 hover:border-rose-600 shadow-rose-950/30"
                    : "bg-rose-50/90 border-rose-200/90 text-rose-600 hover:bg-rose-100 hover:border-rose-300 shadow-rose-100/50"
                }`}
                title="Đô na tê ủng hộ tui ở đây 💖"
              >
                <Heart className="w-2.5 h-2.5 text-rose-500 animate-pulse fill-rose-500 group-hover:scale-110 transition-transform shrink-0" />
                <span className="whitespace-nowrap">Đô na tê ủng hộ tui ở đây</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playMeowSound();
                  setIsDonateModalOpen(true);
                  setIsGgaiGuideOpen(true);
                }}
                className={`mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 group shrink-0 ${
                  isDarkMode
                    ? "bg-blue-950/60 border-blue-800/80 text-blue-300 hover:bg-blue-900/70 hover:border-blue-600 shadow-blue-950/30"
                    : "bg-blue-50/90 border-blue-200/90 text-blue-600 hover:bg-blue-100 hover:border-blue-300 shadow-blue-100/50"
                }`}
                title="Hướng dẫn chơi Ggai 📖"
              >
                <BookOpen className="w-2.5 h-2.5 text-blue-500 group-hover:scale-110 transition-transform shrink-0" />
                <span className="whitespace-nowrap">Hướng dẫn chơi Ggai</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  playMeowSound();
                  setIsUserProfilePresetsModalOpen(true);
                }}
                className={`mt-0.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border transition-all duration-200 cursor-pointer shadow-2xs hover:scale-105 active:scale-95 group shrink-0 ${
                  isDarkMode
                    ? "bg-purple-950/60 border-purple-800/80 text-purple-300 hover:bg-purple-900/70 hover:border-purple-600 shadow-purple-950/30"
                    : "bg-purple-50/90 border-purple-200/90 text-purple-600 hover:bg-purple-100 hover:border-purple-300 shadow-purple-100/50"
                }`}
                title="Sẵn profile user 👤"
              >
                <User className="w-2.5 h-2.5 text-purple-500 group-hover:scale-110 transition-transform shrink-0" />
                <span className="whitespace-nowrap">Sẵn profile user</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto py-1 justify-center sm:justify-start">
          {/* Navigation Tab Switcher */}
          <div className={`grid grid-cols-2 gap-1.5 sm:flex sm:items-center sm:gap-0 p-1.5 sm:p-1 rounded-[1.25rem] sm:rounded-full border text-[10.5px] sm:text-xs font-bold font-mono transition-colors w-full sm:w-auto ${
            isDarkMode ? "bg-stone-900 border-stone-800" : "bg-stone-100 border-stone-200"
          }`}>
            <button
              onClick={() => {
                setActiveTab("repository");
                playMeowSound();
              }}
              className={`px-2 py-2 sm:px-3 sm:py-1.5 rounded-[1rem] sm:rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === "repository"
                  ? isDarkMode
                    ? `${currentPastel.primaryBgDark} ${currentPastel.primaryText} border ${currentPastel.primaryBorderDark} shadow-sm`
                    : `bg-white ${currentPastel.primaryText} border ${currentPastel.primaryBorderLight} shadow-sm`
                  : isDarkMode
                  ? "text-stone-400 hover:text-stone-200"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline whitespace-nowrap">Kho Nhân Vật</span>
              <span className="inline sm:hidden whitespace-nowrap">Kho</span>
            </button>


            <button
              onClick={() => {
                setActiveTab("chat");
                playMeowSound();
              }}
              className={`px-2 py-2 sm:px-3 sm:py-1.5 rounded-[1rem] sm:rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === "chat"
                  ? isDarkMode
                    ? `${currentPastel.primaryBgDark} ${currentPastel.primaryText} border ${currentPastel.primaryBorderDark} shadow-sm`
                    : `bg-white ${currentPastel.primaryText} border ${currentPastel.primaryBorderLight} shadow-sm`
                  : isDarkMode
                  ? "text-stone-400 hover:text-stone-200"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <span>💬</span>
              <span className="hidden sm:inline whitespace-nowrap">Chat Riêng</span>
              <span className="inline sm:hidden whitespace-nowrap">Chat</span>
              <span className="text-[9px] bg-amber-500/20 text-amber-600 dark:text-amber-300 px-1 rounded-full">💸</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("suggestions");
                playMeowSound();
              }}
              className={`px-2 py-2 sm:px-3 sm:py-1.5 rounded-[1rem] sm:rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === "suggestions"
                  ? isDarkMode
                    ? `${currentPastel.primaryBgDark} ${currentPastel.primaryText} border ${currentPastel.primaryBorderDark} shadow-sm`
                    : `bg-white ${currentPastel.primaryText} border ${currentPastel.primaryBorderLight} shadow-sm`
                  : isDarkMode
                  ? "text-stone-400 hover:text-stone-200"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <span>💡</span>
              <span className="hidden sm:inline whitespace-nowrap">Góp Ý Tưởng</span>
              <span className="inline sm:hidden whitespace-nowrap">Góp Ý</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("playground");
                playMeowSound();
              }}
              className={`px-2 py-2 sm:px-3 sm:py-1.5 rounded-[1rem] sm:rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === "playground"
                  ? isDarkMode
                    ? `${currentPastel.primaryBgDark} ${currentPastel.primaryText} border ${currentPastel.primaryBorderDark} shadow-sm`
                    : `bg-white ${currentPastel.primaryText} border ${currentPastel.primaryBorderLight} shadow-sm`
                  : isDarkMode
                  ? "text-stone-400 hover:text-stone-200"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <span>🎮</span>
              <span className="hidden sm:inline whitespace-nowrap">Khu Vui Chơi</span>
              <span className="inline sm:hidden whitespace-nowrap">Chơi</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("support");
                playMeowSound();
                setHasNewSupportPost(false);
                localStorage.setItem("meomeo_last_viewed_support_time", Date.now().toString());
              }}
              className={`relative px-2 py-2 sm:px-3 sm:py-1.5 rounded-[1rem] sm:rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === "support"
                  ? isDarkMode
                    ? `${currentPastel.primaryBgDark} ${currentPastel.primaryText} border ${currentPastel.primaryBorderDark} shadow-sm`
                    : `bg-white ${currentPastel.primaryText} border ${currentPastel.primaryBorderLight} shadow-sm`
                  : isDarkMode
                  ? "text-stone-400 hover:text-stone-200"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              {hasNewSupportPost && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-stone-900 animate-pulse z-10" />
              )}
              <span>🌸</span>
              <span className="hidden sm:inline whitespace-nowrap">Góc Hỗ Trợ</span>
              <span className="inline sm:hidden whitespace-nowrap">Hỗ Trợ</span>
            </button>

            <button
              onClick={() => {
                setActiveTab("feelings");
                playMeowSound();
              }}
              className={`px-2 py-2 sm:px-3 sm:py-1.5 rounded-[1rem] sm:rounded-full transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0 ${
                activeTab === "feelings"
                  ? isDarkMode
                    ? `${currentPastel.primaryBgDark} ${currentPastel.primaryText} border ${currentPastel.primaryBorderDark} shadow-sm`
                    : `bg-white ${currentPastel.primaryText} border ${currentPastel.primaryBorderLight} shadow-sm`
                  : isDarkMode
                  ? "text-stone-400 hover:text-stone-200"
                  : "text-stone-600 hover:text-stone-900"
              }`}
            >
              <span>💌</span>
              <span className="hidden sm:inline whitespace-nowrap">Gửi Tâm Tư</span>
              <span className="inline sm:hidden whitespace-nowrap">Tâm Tư</span>
            </button>


          </div>

          <div className="flex items-center gap-2 shrink-0">
            <UserProfile isDarkMode={isDarkMode} />
          </div>
        </div>
        
        {/* Scroll Progress Bar at bottom of sticky header with active pastel theme gradient */}
        <motion.div
          style={{ scaleX: scrollYProgress, transformOrigin: "left" }}
          className={`absolute bottom-0 left-0 right-0 h-[3px] transition-all duration-500 ${
            isDarkMode ? "bg-stone-700" : `bg-gradient-to-r ${currentPastel.accentGradient}`
          }`}
        />
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-8 py-6 sm:py-10 w-full z-10">
        {activeTab === "chat" ? (
          <CharacterChatView
            characters={characters}
            selectedCharacterId={chatCharacterId}
            onBackToGrid={() => setActiveTab("repository")}
            isDarkMode={isDarkMode}
          />
        ) : activeTab === "suggestions" ? (
          <CharacterIdeaSuggestions 
            isDarkMode={isDarkMode}
            currentPastel={currentPastel}
          />
        ) : activeTab === "playground" ? (
          <PlaygroundZone
            characters={characters}
            isDarkMode={isDarkMode}
            onBackToGrid={() => setActiveTab("repository")}
          />
        ) : activeTab === "support" ? (
          <SupportCorner />
        ) : activeTab === "feelings" ? (
          <FeelingsBoard isDarkMode={isDarkMode} characters={characters} />
        ) : (
          <>
            {/* Dynamic Hero Description */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <span className={`text-[9px] uppercase tracking-[0.3em] ${currentPastel.primaryText} font-bold mb-2 block font-mono`}>
            FB: Người Lười Tạo Bot 🐾🌸
          </span>
          <h1 className={`text-3xl sm:text-4xl font-serif font-black mb-4 tracking-tight transition-all duration-300 bg-gradient-to-r ${currentPastel.accentGradient} bg-clip-text text-transparent`}>
            Thế Giới Nhỏ Của Người Lười Tạo Bot ✨🌸
          </h1>
          <p className={`text-xs sm:text-sm leading-relaxed max-w-2xl mx-auto transition-colors duration-300 ${
            isDarkMode ? "text-stone-400" : "text-stone-500"
          }`}>
            Nếu các nàng gặp bất kỳ vấn đề gì, cứ nhắn tui nhen, tui online 24/7 để ôm và lắng nghe nàng nè. Kính coong kính coong! 🔔🎀
          </p>
        </div>

        {/* Dedicated "Contact tui ở đây" Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          whileHover={{ 
            y: -2,
            boxShadow: isDarkMode 
              ? "none" 
              : `0 12px 30px -10px rgba(${isDarkMode ? "0,0,0" : "244, 63, 94"}, 0.15)`
          }}
          className={`mb-12 border p-6 relative overflow-hidden rounded-2xl shadow-xs transition-all duration-300 max-w-md mx-auto text-center cursor-default ${
            isDarkMode 
              ? `${currentPastel.primaryBgDark} ${currentPastel.primaryBorderDark} text-stone-200` 
              : `${currentPastel.primaryBgLight}/40 ${currentPastel.primaryBorderLight} text-stone-800 shadow-[0_4px_24px_rgba(244,180,190,0.05)]`
          }`}
        >
          {/* Decorative Sparkle Icons */}
          <div className="absolute top-3 left-3 opacity-20">
            <Sparkles className={`w-4 h-4 ${currentPastel.primaryText} animate-pulse`} />
          </div>
          <div className="absolute bottom-3 right-3 opacity-20" style={{ animationDelay: "1s" }}>
            <Sparkles className="w-4 h-4 text-amber-400 dark:text-amber-300 animate-pulse" />
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className={`text-[10px] font-sans font-bold tracking-[0.2em] uppercase px-3.5 py-1 rounded-full border shadow-2xs ${
              isDarkMode 
                ? `${currentPastel.primaryBgDark} ${currentPastel.primaryBorderDark} ${currentPastel.primaryText}` 
                : `${currentPastel.primaryBgLight} ${currentPastel.primaryBorderLight} ${currentPastel.primaryText}`
            }`}>
              💌 Góc Liên Hệ Siêu Đáng Yêu
            </div>

            <p className={`text-xs leading-relaxed max-w-[320px] transition-colors duration-300 ${
              isDarkMode ? "text-stone-300" : "text-stone-600"
            }`}>
              Bất kỳ lúc nào nàng cần hỗ trợ, gặp lỗi bot hay muốn thầm thì góp ý gì thì cứ gõ cửa nhà tui nhaa nheaa~ 🐾🍼
            </p>

            <div className="flex flex-col gap-2.5 w-full max-w-[340px]">
              <UserProfile isDarkMode={isDarkMode} variant="block" />
              
              <a 
                href="https://discord.gg/f9GQa239b"
                target="_blank" 
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-xs font-bold tracking-wider transition-all duration-300 cursor-pointer shadow-xs select-none w-full ${
                  isDarkMode 
                    ? `${currentPastel.primaryBgDark} ${currentPastel.primaryBorderDark} hover:${currentPastel.borderActive} ${currentPastel.primaryText} shadow-purple-950/40` 
                    : `${currentPastel.primaryBgLight} ${currentPastel.primaryBorderLight} hover:opacity-90 ${currentPastel.primaryText}`
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 127.14 96.36" className={`w-4.5 h-4.5 shrink-0 fill-current ${currentPastel.primaryText}`} xmlns="http://www.w3.org/2000/svg">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.88-.65,1.72-1.33,2.53-2a75.78,75.78,0,0,0,72.9,0c.81.71,1.65,1.39,2.53,2a75.78,75.78,0,0,0,31-18.83C129,54.65,123.48,31.58,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
                  </svg>
                  <span>Giao lưu với tụi mình ở đây</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              </a>

              <a 
                href="https://www.facebook.com/profile.php?id=61590680071217"
                target="_blank" 
                rel="noopener noreferrer"
                className={`inline-flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold tracking-wider transition-all duration-300 cursor-pointer shadow-sm select-none w-full ${
                  isDarkMode 
                    ? `bg-stone-950 ${currentPastel.primaryBorderDark} hover:${currentPastel.borderActive} ${currentPastel.primaryText} hover:${currentPastel.primaryBgDark}` 
                    : `bg-white ${currentPastel.primaryBorderLight} hover:${currentPastel.borderActive} ${currentPastel.primaryText} hover:${currentPastel.primaryBgLight}`
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0 fill-[#1877F2]" xmlns="http://www.w3.org/2000/svg">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Người Lười Tạo Bot (Facebook)</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
              </a>

              <a 
                href="https://discord.com/users/1523153767250264227"
                target="_blank" 
                rel="noopener noreferrer"
                onClick={(e) => {
                  // Fallback copy to clipboard when clicked if popup is blocked
                  navigator.clipboard?.writeText("https://discord.com/users/1523153767250264227");
                }}
                className={`inline-flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold tracking-wider transition-all duration-300 cursor-pointer shadow-sm select-none w-full ${
                  isDarkMode 
                    ? `bg-stone-950 ${currentPastel.primaryBorderDark} hover:${currentPastel.borderActive} ${currentPastel.primaryText} hover:${currentPastel.primaryBgDark}` 
                    : `bg-white ${currentPastel.primaryBorderLight} hover:${currentPastel.borderActive} ${currentPastel.primaryText} hover:${currentPastel.primaryBgLight}`
                }`}
              >
                <div className="flex items-center gap-2">
                  <svg viewBox="0 0 127.14 96.36" className="w-4 h-4 shrink-0 fill-[#5865F2]" xmlns="http://www.w3.org/2000/svg">
                    <path d="M107.7,8.07A105.15,105.15,0,0,0,77.26,0a77.19,77.19,0,0,0-3.3,6.83A96.67,96.67,0,0,0,53.22,6.83,77.19,77.19,0,0,0,49.88,0,105.15,105.15,0,0,0,19.44,8.07C3.66,31.58-1.86,54.65,1,77.53A105.73,105.73,0,0,0,32,96.36a77.7,77.7,0,0,0,6.63-10.85,68.43,68.43,0,0,1-10.5-5c.88-.65,1.72-1.33,2.53-2a75.78,75.78,0,0,0,72.9,0c.81.71,1.65,1.39,2.53,2a75.78,75.78,0,0,0,31-18.83C129,54.65,123.48,31.58,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53S36.18,40.36,42.45,40.36,53.83,46,53.83,53,48.72,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.24,60,73.24,53S78.41,40.36,84.69,40.36,96.07,46,96.07,53,91,65.69,84.69,65.69Z" />
                  </svg>
                  <span>Hae Aeni (Discord cá nhân)</span>
                </div>
                <ExternalLink className="w-3.5 h-3.5 opacity-60 shrink-0" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Meo Meo Diner - Dedicated Random Food Platter Station */}
        <div className={`mb-12 border p-6 sm:p-8 relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 ${
          isDarkMode 
            ? `${currentPastel.primaryBgDark} ${currentPastel.primaryBorderDark} text-stone-200` 
            : `${currentPastel.primaryBgLight}/40 ${currentPastel.primaryBorderLight} text-stone-750`
        }`}>
          {/* Background sparkles decoration */}
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
            isDarkMode ? "bg-rose-950/10" : "bg-rose-100/20"
          }`} />
          <div className={`absolute bottom-0 left-0 w-32 h-32 rounded-full blur-2xl pointer-events-none ${
            isDarkMode ? "bg-amber-950/10" : "bg-amber-100/20"
          }`} />
          
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
            <div className="flex items-start space-x-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 mt-1 animate-pulse border transition-colors duration-300 ${
                isDarkMode 
                  ? `${currentPastel.primaryBgDark} ${currentPastel.primaryBorderDark}` 
                  : `${currentPastel.primaryBgLight} ${currentPastel.primaryBorderLight}`
              }`}>
                <ChefHat className={`w-6 h-6 ${currentPastel.primaryText}`} />
              </div>
              <div>
                <h2 className={`text-lg font-serif font-semibold tracking-wide flex items-center gap-2 transition-colors duration-300 ${
                  isDarkMode ? "text-stone-100" : "text-stone-800"
                }`}>
                  🍽️ Góc Phục Vụ Bé Cưng Ngẫu Nhiên
                  <span className={`text-[10px] uppercase font-mono tracking-widest border px-2.5 py-0.5 rounded-full font-bold transition-all duration-300 ${
                    isDarkMode 
                      ? `${currentPastel.primaryText} ${currentPastel.primaryBgDark} ${currentPastel.primaryBorderDark}` 
                      : `${currentPastel.primaryText} ${currentPastel.primaryBgLight} ${currentPastel.primaryBorderLight}`
                  }`}>MEOW MEOW DINER</span>
                </h2>
                <p className={`text-xs mt-1 leading-relaxed max-w-xl transition-colors duration-300 ${
                  isDarkMode ? "text-stone-400" : "text-stone-500"
                }`}>
                  Hãy để Meo Meo bưng lên một em  ngẫu nhiên cho các nàng thưởng thức thử nhe~ 🐾🍯
                </p>
              </div>
            </div>

            {/* Serve Button */}
            {!isServing && !servedCharacter && (
              <div className="relative">
                {/* Behind Glow pulsing effect */}
                {!isDarkMode && (
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      opacity: [0.2, 0.5, 0.2],
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-amber-500/20 to-rose-500/20 blur-md pointer-events-none"
                  />
                )}

                {/* Idle floating sparkles */}
                <div className="absolute inset-0 pointer-events-none overflow-visible">
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={`idle-${i}`}
                      initial={{ opacity: 0, scale: 0, y: 10, x: i * 30 - 30 }}
                      animate={{
                        opacity: [0, 0.8, 0],
                        scale: [0.5, 1, 0.5],
                        y: -35 - Math.random() * 15,
                        x: i * 40 - 40 + (Math.random() * 20 - 10),
                      }}
                      transition={{
                        duration: 2 + Math.random(),
                        repeat: Infinity,
                        delay: i * 0.6,
                        ease: "easeInOut",
                      }}
                      className="absolute top-1/2 left-1/2"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-300/50" />
                    </motion.div>
                  ))}
                </div>

                {/* Click Sparkles list */}
                <AnimatePresence>
                  {buttonSparkles.map((sp) => (
                    <motion.div
                      key={sp.id}
                      initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotate: 0 }}
                      animate={{ 
                        x: sp.x, 
                        y: sp.y, 
                        opacity: [0, 1, 1, 0], 
                        scale: [0, 1.3, 1, 0],
                        rotate: [0, 180, 360]
                      }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      className="absolute pointer-events-none z-50 flex items-center justify-center"
                      style={{ 
                        left: "50%", 
                        top: "50%",
                        marginLeft: -sp.size / 2,
                        marginTop: -sp.size / 2,
                      }}
                    >
                      <Sparkles 
                        style={{ color: sp.color, width: sp.size, height: sp.size }} 
                        className="drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>

                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    triggerBlingBling();
                    handleServeDish();
                  }}
                  className={`px-6 py-3 border transition-all text-xs font-mono uppercase tracking-widest flex items-center gap-2 shrink-0 shadow-md cursor-pointer relative overflow-hidden group rounded-full font-bold ${
                    isDarkMode 
                      ? "bg-stone-900 hover:bg-stone-800 border-stone-800 text-stone-200" 
                      : "bg-gradient-to-r from-rose-100 to-amber-100 hover:from-rose-200 hover:to-amber-200 border border-rose-200 text-stone-800"
                  }`}
                >
                  <Utensils className="w-4 h-4 text-rose-500 animate-bounce" />
                  <span className="relative z-10 flex items-center gap-1">
                    Quay ngẫu nhiên món ăn ở đây
                  </span>
                </motion.button>
              </div>
            )}
          </div>

          {/* Cooking/Serving State */}
          {isServing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-6 p-6 border border-dashed rounded-2xl flex flex-col items-center justify-center text-center space-y-5 transition-colors duration-300 ${
                isDarkMode ? "border-rose-900/60 bg-rose-950/10" : "border-rose-300/60 bg-rose-50/40"
              }`}
            >
              <div className="relative">
                <div className={`w-16 h-16 rounded-full border-2 animate-spin flex items-center justify-center ${
                  isDarkMode ? "border-rose-900 border-t-rose-500" : "border-rose-200 border-t-rose-500"
                }`}>
                  <ChefHat className="w-6 h-6 text-rose-500 animate-bounce" />
                </div>
                <Sparkles className="w-4 h-4 text-rose-400 absolute -top-1 -right-1 animate-ping" />
              </div>
              <div className="w-full max-w-md">
                <p className={`text-sm font-serif italic font-medium animate-pulse min-h-[20px] mb-2 ${
                  isDarkMode ? "text-stone-300" : "text-stone-700"
                }`}>{servingMessage}</p>
                
                {/* Visual Progress Bar */}
                <div className={`relative w-full h-2 overflow-hidden rounded-full border my-3 transition-colors duration-300 ${
                  isDarkMode ? "bg-stone-950 border-stone-800" : "bg-stone-100 border-stone-200"
                }`}>
                  <motion.div 
                    initial={{ width: "0%" }}
                    animate={{ width: `${servingProgress}%` }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    className={`h-full rounded-full relative ${
                      isDarkMode ? "bg-stone-500" : "bg-gradient-to-r from-amber-300 to-rose-400"
                    }`}
                  >
                    {/* Glowing beam effect running inside - Only in Light Mode */}
                    {!isDarkMode && (
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.4)_50%,transparent_100%)] w-2/3 h-full animate-[shimmer_1.5s_infinite] -skew-x-12" />
                    )}
                  </motion.div>
                </div>
                
                <div className={`flex justify-between items-center text-[10px] font-mono uppercase tracking-widest mt-1 ${
                  isDarkMode ? "text-stone-500" : "text-stone-400"
                }`}>
                  <span>Đang chế biến tinh hoa món ăn phục vụ khách hàng...</span>
                  <span className="text-rose-500 font-bold">{servingProgress}%</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Served Character Result Card */}
          {servedCharacter && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-6 border p-5 sm:p-6 rounded-2xl shadow-sm transition-colors duration-300 ${
                isDarkMode ? "border-rose-900 bg-rose-950/10" : "border-rose-200 bg-rose-50/50"
              }`}
            >
              <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center justify-between">
                
                {/* Character Platter Preview */}
                <div className="flex items-center gap-4">
                  <motion.div 
                    initial={{ scale: 0.7, rotate: -12 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 220, damping: 14 }}
                    className={`text-4xl sm:text-5xl shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-full aspect-square flex items-center justify-center shadow-inner relative overflow-hidden border transition-colors duration-300 ${
                      isDarkMode ? "bg-stone-950 border-rose-900" : "bg-white border-rose-200"
                    }`}
                  >
                    {isImageUrl(servedCharacter.avatar) ? (
                      <img 
                        src={formatImageUrl(servedCharacter.avatar)} 
                        alt={servedCharacter.name} 
                        className="w-full h-full object-cover aspect-square rounded-full shrink-0" 
                        referrerPolicy="no-referrer"
                        onError={(e) => handleImageError(e, servedCharacter.name)}
                      />
                    ) : (
                      <span>{servedCharacter.avatar}</span>
                    )}
                    <span className="absolute -bottom-1 -right-1 bg-rose-400 text-stone-900 dark:text-white text-[8px] px-1.5 py-0.5 font-mono font-bold rounded-full uppercase z-10">SERVED</span>

                    {/* Ring of magical floating sparkles for celebration */}
                    {[...Array(6)].map((_, i) => {
                      const angle = (i * 360) / 6;
                      const rad = (angle * Math.PI) / 180;
                      const distance = 42;
                      const x = Math.cos(rad) * distance;
                      const y = Math.sin(rad) * distance;
                      return (
                        <motion.div
                          key={`served-sparkle-${i}`}
                          initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                          animate={{
                            opacity: [0, 1, 1, 0],
                            scale: [0, 1.2, 0.8, 0],
                            x: [0, x],
                            y: [0, y],
                          }}
                          transition={{
                            duration: 1.6,
                            repeat: Infinity,
                            repeatDelay: 0.8,
                            delay: i * 0.15,
                            ease: "easeOut",
                          }}
                          className="absolute"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
                        </motion.div>
                      );
                    })}
                  </motion.div>
                  <div>
                    <span className="text-[9px] uppercase font-mono tracking-widest text-rose-500 font-bold block">Đã ra lò món ngon do Meo Meo làm , mời thưởng thức</span>
                    <h3 className={`text-xl font-serif mt-0.5 flex items-center gap-2 font-semibold transition-colors duration-300 ${
                      isDarkMode ? "text-stone-100" : "text-stone-800"
                    }`}>
                      {servedCharacter.name}
                    </h3>
                    <p className="text-xs text-rose-500 font-medium tracking-wide mt-1">{servedCharacter.role}</p>
                    <p className={`text-xs line-clamp-2 mt-2 italic max-w-xl transition-colors duration-300 ${
                      isDarkMode ? "text-stone-300" : "text-stone-600"
                    }`}>
                      "{servedCharacter.plot}"
                    </p>
                  </div>
                </div>

                {/* Restaurant Bill / Action items */}
                <div className={`flex flex-row sm:flex-col gap-2 w-full sm:w-auto shrink-0 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-6 transition-colors duration-300 ${
                  isDarkMode ? "border-stone-800" : "border-stone-200"
                }`}>
                  <button
                    onClick={() => {
                      playMeowSound();
                      handleSelectCharacter(servedCharacter);
                    }}
                    className={`flex-1 sm:w-full px-4 py-2 text-xs font-mono uppercase tracking-widest transition-all font-bold text-center flex items-center justify-center gap-1.5 cursor-pointer rounded-full shadow-sm hover:shadow ${
                      isDarkMode 
                        ? "bg-amber-950/80 hover:bg-amber-900 text-amber-200" 
                        : "bg-amber-200 hover:bg-amber-300 text-amber-900"
                    }`}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Tìm Hiểu Bé Yêu 📖</span>
                  </button>

                  <div className="flex gap-2 flex-1 sm:w-full">
                    <button
                      onClick={handleServeDish}
                      className={`flex-1 px-3 py-2 border text-xs font-mono uppercase tracking-wider transition-all text-center flex items-center justify-center gap-1 cursor-pointer rounded-full shadow-xs ${
                        isDarkMode 
                          ? "border-rose-900 bg-stone-900 hover:bg-rose-950/40 text-rose-300" 
                          : "border-rose-200 bg-white hover:bg-rose-50 text-stone-600 hover:text-rose-600"
                      }`}
                    >
                      <span>Đổi Bé Khác 🔁</span>
                    </button>
                    <button
                      onClick={() => setServedCharacter(null)}
                      className={`px-3 py-2 border text-xs font-mono transition-all text-center flex items-center justify-center cursor-pointer rounded-full ${
                        isDarkMode 
                          ? "border-stone-800 bg-stone-900 hover:bg-red-950/20 text-stone-500 hover:text-red-400" 
                          : "border-stone-200 bg-white hover:bg-red-50 text-stone-400 hover:text-red-500"
                      }`}
                      title="Cất bé đi nhen 📦"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          )}

        </div>



        {/* Filters, Categories and Search */}
        <div className={`mb-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b transition-colors duration-300 ${
          isDarkMode ? "border-stone-800" : "border-[#eadbca]/30"
        }`}>
          {/* Custom styled search input & Favorite Button Group */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                placeholder="Tìm kiếm nhân vật nàng iu muốn..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-11 pr-10 py-2.5 text-xs sm:text-sm font-serif italic tracking-wide rounded-full shadow-xs transition-colors duration-300 ${
                  isDarkMode 
                    ? `bg-stone-900 border-stone-800 text-stone-100 placeholder-stone-500 ${currentPastel.focusRing}` 
                    : `bg-white border-[#eadbca]/60 text-stone-800 placeholder-stone-400 focus:outline-none ${currentPastel.focusRing}`
                }`}
                id="search-input"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <select
                value={gridSortFilter}
                onChange={(e) => {
                  playMeowSound();
                  setGridSortFilter(e.target.value as any);
                }}
                className={`px-5 py-2.5 text-[9px] tracking-widest uppercase font-mono font-bold transition-all border cursor-pointer rounded-full focus:outline-none ${
                  isDarkMode
                    ? `bg-stone-900 text-stone-300 border-stone-800 hover:${currentPastel.primaryText}`
                    : `bg-white text-stone-700 border-[#eadbca]/60 hover:${currentPastel.primaryText}`
                }`}
                title="Sắp xếp & lọc danh sách bé yêu"
              >
                <option value="all">✨ Tất Cả Các Bé Yêu</option>
                <option value="favorites">❤️ Các Bé Đã Thả Tim</option>
                <option value="newest">🆕 Gương Mặt Mới Toanh</option>
                <option value="most_views">🔥 Được Cưng Chiều Nhất</option>
              </select>
            </div>

            <AnimatePresence>
              {(searchQuery !== "" || gridSortFilter !== "all" || selectedCategory !== "Tất cả") && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8, x: -10 }}
                  onClick={() => {
                    playMeowSound();
                    setSearchQuery("");
                    setGridSortFilter("all");
                    setSelectedCategory("Tất cả");
                  }}
                  className={`px-4 py-2.5 text-[9px] tracking-widest uppercase font-mono font-bold border rounded-full flex items-center gap-1.5 shrink-0 transition-all shadow-sm cursor-pointer ${
                    isDarkMode
                      ? `bg-stone-900 ${currentPastel.primaryText} ${currentPastel.primaryBorderDark} hover:bg-stone-800`
                      : `${currentPastel.primaryBgLight} ${currentPastel.primaryText} ${currentPastel.primaryBorderLight} hover:opacity-90`
                  }`}
                  title="Xóa tất cả bộ lọc"
                >
                  <X className="w-3 h-3" />
                  XÓA BỘ LỌC
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* SECTION 1: HỒ SƠ NHÂN VẬT (Character Profiles Grid) */}
        <section className="mb-14">
          <div className="flex items-center justify-between mb-6 pb-3 border-b border-stone-200/60 dark:border-stone-800">
            <div className="flex items-center gap-2">
              <Sparkles className={`w-5 h-5 ${currentPastel.primaryText}`} />
              <h2 className={`text-base sm:text-lg font-bold uppercase tracking-wider font-sans ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                Danh Sách Bé Yêu 🌸
              </h2>
              <span className={`text-xs font-mono px-2.5 py-0.5 rounded-full font-bold border ${
                isDarkMode 
                  ? `${currentPastel.primaryBgDark} ${currentPastel.primaryText} ${currentPastel.primaryBorderDark}` 
                  : `${currentPastel.primaryBgLight} ${currentPastel.primaryText} ${currentPastel.primaryBorderLight}`
              }`}>
                {filteredCharacters.length} em bé
              </span>
            </div>
          </div>

          {/* Categorization Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4 sm:mx-0 sm:px-0" style={{ scrollbarWidth: "none" }}>
            {CHARACTER_CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    playMeowSound();
                    setSelectedCategory(cat);
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-full shrink-0 transition-all cursor-pointer shadow-xs snap-start border ${
                    isActive
                      ? `${currentPastel.tagActive} text-stone-900 border-transparent shadow-md`
                      : isDarkMode
                        ? "bg-stone-900 border-stone-800 text-stone-300 hover:bg-stone-800 hover:text-white"
                        : `bg-white border-[#eadbca]/50 text-stone-600 hover:${currentPastel.primaryBgLight} hover:${currentPastel.primaryText}`
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {filteredCharacters.length === 0 ? (
            <div className={`p-12 text-center border border-dashed rounded-2xl transition-colors duration-300 ${
              isDarkMode ? "border-stone-800 text-stone-400" : "border-[#eadbca] text-stone-500"
            }`}>
              <p className="text-sm font-serif italic mb-3">Không tìm thấy nhân vật nào phù hợp với tìm kiếm của nàng...</p>
              <button
                onClick={() => {
                  playMeowSound();
                  setSearchQuery("");
                  setGridSortFilter("all");
                }}
                className={`px-4 py-2 text-xs font-mono font-bold rounded-full border transition-all cursor-pointer ${
                  isDarkMode ? "border-stone-700 hover:bg-stone-800 text-stone-200" : "border-stone-300 hover:bg-stone-100 text-stone-700"
                }`}
              >
                Xóa bộ lọc tìm kiếm 🔄
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredCharacters.map((char, idx) => (
                <CharacterCard
                  key={char.id}
                  char={char}
                  idx={idx}
                  onSelect={() => handleSelectCharacter(char)}
                  onStartChat={() => {
                    if (char.id === "kaven-nyx") {
                      setKavenLockedAlertOpen(true);
                      return;
                    }
                    setChatCharacterId(char.id);
                    setActiveTab("chat");
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  onEdit={() => {
                    if (char.id === "kaven-nyx") {
                      setKavenLockedAlertOpen(true);
                      return;
                    }
                    setSelectedCharacter(char);
                    if (currentUserEmail === "nguyenthao19876.64@gmail.com") {
                      setIsEditMode(true);
                    } else {
                      setIsEditMode(false);
                    }
                  }}
                  onDelete={(e) => {
                    if (char.id === "kaven-nyx") {
                      e.stopPropagation();
                      setKavenLockedAlertOpen(true);
                      return;
                    }
                    handleDeleteCharacter(char.id, e);
                  }}
                  onToggleFavorite={(e) => handleToggleFavorite(char.id, e)}
                  getThemeDetails={getThemeDetails}
                  isDarkMode={isDarkMode}
                  onNoLinkClick={() => {
                    if (char.id === "kaven-nyx") {
                      setKavenLockedAlertOpen(true);
                    } else {
                      setNoLinkAlertOpen(true);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </section>

        {/* SECTION 2: KHU VỰC TƯƠNG TÁC & LEAK THÓI QUEN XẤU MẤY ẺM */}
        <section className={`p-6 sm:p-8 rounded-3xl border transition-all duration-300 mb-12 ${
          isDarkMode 
            ? "bg-stone-900/40 border-stone-800/80" 
            : "bg-white/80 border-[#f2e3e3] shadow-sm"
        }`}>
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-dashed border-stone-200/60 dark:border-stone-800">
            <div className={`p-2.5 rounded-2xl ${isDarkMode ? "bg-rose-950/60 text-rose-400" : "bg-rose-50 text-rose-600"}`}>
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base sm:text-lg font-bold uppercase tracking-wider font-sans ${isDarkMode ? "text-stone-100" : "text-stone-800"}`}>
                Góc Buôn Chuyện & Vạch Trần Tật Xấu 🤫💖
              </h2>
              <p className="text-xs text-stone-400 font-sans mt-0.5">Nơi khui tất tần tật thói hư tật xấu thầm kín và chia sẻ lưu bút ngọt ngào dành cho các bé yêu</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 1. NƠI LEAK THÓI QUEN XẤU MẤY ÈM */}
            <div className={`p-5 rounded-2xl border flex flex-col gap-4 transition-all duration-300 ${
              isDarkMode 
                ? "bg-stone-950/60 border-stone-800/80" 
                : "bg-[#fcfaf7] border-[#f2e3e3]"
            }`}>
              <div className={`font-bold text-xs uppercase tracking-wider flex items-center justify-between ${isDarkMode ? "text-stone-200" : "text-stone-800"}`}>
                <span className="flex items-center gap-1.5">
                  <span>Bốc Phốt Các Ẻm Tại Đây</span>
                </span>
                <span id="leakCount" className="text-stone-400 font-mono font-normal text-[11px]">({secretComments.length} bài leak)</span>
              </div>

              <div id="leakList" className="max-h-56 overflow-y-auto space-y-2 border-t border-b border-dashed border-stone-200/40 dark:border-stone-800/60 py-3 text-xs scrollbar-thin">
                {secretComments.length === 0 ? (
                  <p className="text-stone-400 italic text-center py-4">Chưa có thói quen xấu nào bị leak...</p>
                ) : (
                  secretComments.map((item) => {
                    const targetChar = characters.find(c => c.id === item.secretId);
                    return (
                      <div key={item.id} className={`p-3 rounded-xl border text-xs relative ${
                        isDarkMode ? "bg-stone-900/80 border-stone-800 text-stone-200" : "bg-white border-[#f0f0f0] text-stone-800 shadow-2xs"
                      }`}>
                        <div className="flex items-center justify-between mb-1">
                          <div>
                            <span className={`font-bold ${currentPastel.primaryText}`}>{item.author}</span>
                            <span className="text-[10px] text-stone-400 font-mono ml-1.5">đã leak về <b>{targetChar ? targetChar.name : "Nhân vật khác"}</b>:</span>
                          </div>
                          <button
                            onClick={() => handleDeleteSecretComment(item.id)}
                            className="text-stone-400 hover:text-rose-500 transition-colors p-1 rounded cursor-pointer"
                            title="Xóa leak"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="whitespace-pre-wrap leading-relaxed">{item.content}</p>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    id="leakChar"
                    value={leakChar}
                    onChange={(e) => setLeakChar(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-xs outline-none transition-colors ${
                      isDarkMode ? "bg-stone-900 border-stone-800 text-stone-200" : "bg-white border-[#f2e3e3] text-stone-800"
                    }`}
                  >
                    {characters.map(c => (
                      <option key={c.id} value={c.id}>Bot: {c.name}</option>
                    ))}
                    <option value="khac">Bot / Nhân vật khác</option>
                  </select>

                  <input
                    type="text"
                    id="leakName"
                    placeholder="Biệt danh của nàng... (mặc định: Bé Thỏ Ẩn Danh 🐰🌸)"
                    value={leakName}
                    onChange={(e) => setLeakName(e.target.value)}
                    className={`w-full border rounded-xl p-2.5 text-xs outline-none transition-colors ${
                      isDarkMode ? "bg-stone-900 border-stone-800 text-stone-200" : "bg-white border-[#f2e3e3] text-stone-800"
                    }`}
                  />
                </div>

                <textarea
                  id="leakContent"
                  rows={2}
                  placeholder="Nhập thói hư tật xấu thầm kín nàng muốn khui ở đây nha... 🤫📝"
                  value={leakContent}
                  onChange={(e) => setLeakContent(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 text-xs outline-none resize-none transition-colors ${
                    isDarkMode ? "bg-stone-900 border-stone-800 text-stone-200" : "bg-white border-[#f2e3e3] text-stone-800"
                  }`}
                />

                <div className="flex justify-end">
                  <button
                    onClick={addLeak}
                    className={`${currentPastel.primaryBtnBg} font-bold text-xs py-2 px-5 rounded-full cursor-pointer transition-all flex items-center gap-1.5 shadow-sm active:scale-95`}
                  >
                    BẮT ĐẦU PHỚT 🤫✈
                  </button>
                </div>
              </div>
            </div>

            {/* 2. NHẬN XÉT BOT NHÀ MEOMEO */}
            <div className={`p-5 rounded-2xl border flex flex-col gap-4 transition-all duration-300 ${
              isDarkMode 
                ? "bg-stone-950/60 border-stone-800/80" 
                : "bg-[#fcfaf7] border-[#f2e3e3]"
            }`}>
              <div className={`font-bold text-xs uppercase tracking-wider flex items-center justify-between ${isDarkMode ? "text-stone-200" : "text-stone-800"}`}>
                <span className="flex items-center gap-1.5">
                  <span>💬 LƯU BÚT NGỌT NGÀO GỬI MEO MEO 💌🌸</span>
                </span>
                <span id="botFeedbacksCount" className="text-stone-400 font-mono font-normal text-[11px]">({botFeedbacks.length} lời nhắn)</span>
              </div>

              <div id="botFeedbacksList" className="max-h-56 overflow-y-auto space-y-2 border-t border-b border-dashed border-stone-200/40 dark:border-stone-800/60 py-3 text-xs scrollbar-thin">
                {botFeedbacks.length === 0 ? (
                  <p className="text-stone-400 italic text-center py-4">Chưa có lời nhắn nào gửi về nhà...</p>
                ) : (
                  botFeedbacks.map((fb) => (
                    <div key={fb.id} className={`p-3 rounded-xl border text-xs relative ${
                      isDarkMode ? "bg-stone-900/80 border-stone-800 text-stone-200" : "bg-white border-[#f0f0f0] text-stone-800 shadow-2xs"
                    }`}>
                      <div className="flex items-center justify-between mb-1">
                        <div>
                          <span className={`font-bold ${currentPastel.primaryText}`}>{fb.author || fb.name || "Ẩn danh"}</span>
                          {fb.timestamp && <span className="text-[10px] text-stone-400 font-mono ml-2">({fb.timestamp})</span>}
                        </div>
                        <button
                          onClick={() => handleDeleteBotFeedback(fb.id)}
                          className="text-stone-400 hover:text-rose-500 transition-colors p-1 rounded cursor-pointer"
                          title="Xóa lời nhắn"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <p className="whitespace-pre-wrap leading-relaxed">{fb.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2.5 pt-1">
                <input
                  type="text"
                  placeholder="Biệt danh ngọt ngào của nàng... (mặc định: Em Bé Giấu Tên 🌸)"
                  value={fbName}
                  onChange={(e) => setFbName(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 text-xs outline-none transition-colors ${
                    isDarkMode ? "bg-stone-900 border-stone-800 text-stone-200" : "bg-white border-[#f2e3e3] text-stone-800"
                  }`}
                />

                <textarea
                  rows={2}
                  placeholder="Hãy gửi những lời nhắn nhủ, yêu thương hoặc góp ý siêu đáng yêu của nàng dành cho Meo Meo nhé... ✨🍼"
                  value={fbContent}
                  onChange={(e) => setFbContent(e.target.value)}
                  className={`w-full border rounded-xl p-2.5 text-xs outline-none resize-none transition-colors ${
                    isDarkMode ? "bg-stone-900 border-stone-800 text-stone-200" : "bg-white border-[#f2e3e3] text-stone-800"
                  }`}
                />

                <div className="flex justify-end">
                  <button
                    onClick={addFeedback}
                    className={`${currentPastel.primaryBtnBg} font-bold text-xs py-2 px-5 rounded-full cursor-pointer transition-all flex items-center gap-1.5 shadow-sm active:scale-95`}
                  >
                    GỬI YÊU THƯƠNG ✨
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
          </>
        )}
      </main>

      {/* Detailed Profile Modal */}
      <AnimatePresence>
        {selectedCharacter && (
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              className={`w-full max-w-3xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border transition-colors duration-300 ${
                isDarkMode 
                  ? "bg-stone-950 border-stone-800 text-white" 
                  : `${currentPastel.pageBgLight} ${currentPastel.primaryBorderLight} text-stone-800`
              }`}
              id="character-modal"
            >
              {/* Modal Header */}
              <div className={`p-6 border-b flex justify-between items-center transition-colors duration-300 ${
                isDarkMode 
                  ? "border-stone-900 bg-stone-900/90" 
                  : `${currentPastel.primaryBorderLight} bg-gradient-to-r ${currentPastel.accentGradient}/15 ${currentPastel.primaryBgLight}`
              }`}>
                <div className="flex items-center space-x-3">
                  <span className={`text-3xl select-none w-10 h-10 rounded-full aspect-square flex items-center justify-center overflow-hidden shrink-0 shadow-inner border transition-colors ${
                    isDarkMode ? "bg-stone-900 border-stone-800" : `bg-white ${currentPastel.primaryBorderLight}`
                  }`}>
                    {isImageUrl(selectedCharacter.avatar) ? (
                      <img 
                        src={formatImageUrl(selectedCharacter.avatar)} 
                        alt={selectedCharacter.name} 
                        className="w-full h-full object-cover aspect-square rounded-full shrink-0" 
                        referrerPolicy="no-referrer"
                        onError={(e) => handleImageError(e, selectedCharacter.name)}
                      />
                    ) : (
                      selectedCharacter.avatar
                    )}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className={`text-xl font-serif italic leading-tight font-bold transition-colors ${
                        isDarkMode ? "text-white" : "text-stone-800"
                      }`}>
                        {isEditMode ? "Hiệu chỉnh nhân vật" : selectedCharacter.name}
                      </h2>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border hidden sm:inline-flex items-center gap-1 ${currentPastel.badgeBg} ${currentPastel.badgeText}`}>
                        {currentPastel.icon} {currentPastel.name}
                      </span>
                    </div>
                    {!isEditMode && (
                      <div className="flex items-center gap-3 mt-1">
                        <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                          isDarkMode ? "text-stone-400" : "text-stone-500"
                        }`}>
                          <Heart className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20" />
                          <span>{selectedCharacter.favoritesCount || 0} lượt thích</span>
                        </span>
                        <span className={`text-[10px] font-mono font-bold flex items-center gap-1 ${
                          isDarkMode ? "text-stone-400" : "text-stone-500"
                        }`}>
                          <Eye className="w-3.5 h-3.5 text-sky-400" />
                          <span>{selectedCharacter.views || 0} lượt xem</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  
                  {/* Category badge removed */}
                  <button
                    onClick={() => {
                      setSelectedCharacter(null);
                      setIsEditMode(false);
                    }}
                    className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                      isDarkMode ? "hover:bg-stone-800 text-stone-400 hover:text-stone-200" : "hover:bg-stone-100 text-stone-400 hover:text-stone-700"
                    }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Body / Scrollable Content */}
              <div className="p-6 md:p-8 overflow-y-auto flex-1 space-y-6" id="modal-scroll-container">
                <AnimatePresence mode="wait">
                  {(selectedCharacter.id === "kaiza-tachibana" || selectedCharacter.id === "tham-da" || selectedCharacter.id === "kanzaki-ren") && ageVerification === "pending" ? (
                    <motion.div
                      key="age-verification"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="flex flex-col items-center justify-center py-10 px-4 text-center space-y-6"
                    >
                      <div className="w-20 h-20 rounded-full bg-rose-500/10 dark:bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center animate-pulse shadow-md">
                        <span className="text-3xl font-extrabold text-rose-500 font-mono">18+</span>
                      </div>
                      <div className="space-y-3 max-w-md">
                        <h3 className="text-lg font-serif font-bold text-stone-800 dark:text-stone-100">
                          Cảnh báo nội dung nhạy cảm! 🔞
                        </h3>
                        <p className="text-sm text-stone-600 dark:text-stone-300 leading-relaxed font-sans">
                          Đây là nhân vật 18+. Nàng iu chắc chắn là mình đủ hoặc trên 18 rồi chứ?
                        </p>
                        <p className="text-xs text-rose-500/90 dark:text-rose-400/90 leading-relaxed font-sans font-semibold italic bg-rose-500/5 dark:bg-rose-500/10 p-3 rounded-xl border border-rose-500/10 dark:border-rose-500/20 text-justify">
                          ⚠️ Hãy chắc chắn nàng iu đã đủ tuổi vì tui sẽ không chịu bất kì trách nhiệm nào nếu nàng iu vẫn cố chấp ạ, hãy thông cảm cho Meo
                        </p>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm pt-2">
                        <button
                          type="button"
                          onClick={() => setAgeVerification("rejected")}
                          className="flex-1 px-4 py-2.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-700 dark:text-stone-300 rounded-full font-bold font-sans text-xs transition-all cursor-pointer border border-stone-300 dark:border-stone-800 shadow-xs"
                        >
                          Nô, tui còn trẻ lắm chưa chơi được
                        </button>
                        <button
                          type="button"
                          onClick={() => setAgeVerification("verified")}
                          className={`flex-1 px-4 py-2.5 rounded-full font-bold font-sans text-xs transition-all cursor-pointer shadow-md ${
                            isDarkMode
                              ? "bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700"
                              : "bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-stone-900"
                          }`}
                        >
                          Yé, tui đã đủ tuổi hãy để tui chơi
                        </button>
                      </div>
                    </motion.div>
                  ) : isEditMode ? (
                    /* EDIT MODE PANEL */
                    <motion.form 
                      key="edit-panel"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      onSubmit={handleUpdateCharacter}
                      className="space-y-4"
                    >
                      {/* Name and Role inputs */}
                      <div className="grid grid-cols-1 sm:grid-cols-1 gap-4">
                        <div>
                          <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">TÊN NHÂN VẬT *</label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className={`w-full px-3 py-2 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans rounded-xl`}
                          />
                        </div>
                      </div>

                      {/* Link input */}
                      <div>
                        <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">ĐƯỜNG DẪN LIÊN KẾT NHÂN VẬT *</label>
                        <input
                          type="text"
                          required
                          value={editLink}
                          onChange={(e) => setEditLink(e.target.value)}
                          className={`w-full px-3 py-2 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans rounded-xl`}
                        />
                      </div>

                      {/* Plot input */}
                      <div>
                        <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">THỂ LOẠI / TAGS (GENRE / TAGS)</label>
                        <textarea
                          rows={3}
                          value={editPlot}
                          onChange={(e) => setEditPlot(e.target.value)}
                          className={`w-full px-3 py-2 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans resize-none rounded-xl`}
                          placeholder="Ví dụ: Ngọt ngào, Tổng tài, Chiều chuộng, Ngược luyến... (Dùng dấu phẩy để phân tách)"
                        />
                      </div>

                      {/* Storyline input */}
                      <div>
                        <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">CỐT TRUYỆN CHI TIẾT (STORYLINE)</label>
                        <textarea
                          rows={10}
                          value={editStoryline}
                          onChange={(e) => setEditStoryline(e.target.value)}
                          className={`w-full px-3 py-2 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans resize-none rounded-xl`}
                          placeholder="Kể chi tiết về bối cảnh, cuộc đời, biến cố của nhân vật..."
                        />
                      </div>

                      {/* Character Metadata Fields */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">Tuổi</label>
                          <input
                            type="text"
                            value={editAge}
                            onChange={(e) => setEditAge(e.target.value)}
                            placeholder="Ví dụ: 24"
                            className={`w-full px-3 py-1.5 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans rounded-xl`}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">Giới tính</label>
                          <input
                            type="text"
                            value={editGender}
                            onChange={(e) => setEditGender(e.target.value)}
                            placeholder="Nam / Nữ"
                            className={`w-full px-3 py-1.5 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans rounded-xl`}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">Chiều cao</label>
                          <input
                            type="text"
                            value={editHeight}
                            onChange={(e) => setEditHeight(e.target.value)}
                            placeholder="1m85"
                            className={`w-full px-3 py-1.5 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans rounded-xl`}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">MBTI</label>
                          <input
                            type="text"
                            value={editMbti}
                            onChange={(e) => setEditMbti(e.target.value)}
                            placeholder="INTJ"
                            className={`w-full px-3 py-1.5 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans rounded-xl`}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">Nghề nghiệp</label>
                          <input
                            type="text"
                            value={editOccupation}
                            onChange={(e) => setEditOccupation(e.target.value)}
                            placeholder="Tổng giám đốc"
                            className={`w-full px-3 py-1.5 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans rounded-xl`}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">Quan hệ với bạn</label>
                          <input
                            type="text"
                            value={editRelationship}
                            onChange={(e) => setEditRelationship(e.target.value)}
                            placeholder="Bạn trai"
                            className={`w-full px-3 py-1.5 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans rounded-xl`}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">Xưng hô</label>
                          <input
                            type="text"
                            value={editPronouns}
                            onChange={(e) => setEditPronouns(e.target.value)}
                            placeholder="Anh - Em"
                            className={`w-full px-3 py-1.5 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans rounded-xl`}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">Cung hoàng đạo</label>
                          <input
                            type="text"
                            value={editZodiac}
                            onChange={(e) => setEditZodiac(e.target.value)}
                            placeholder="Bọ Cạp"
                            className={`w-full px-3 py-1.5 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans rounded-xl`}
                          />
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">Sinh nhật (Mã Nhật Ký) *</label>
                          <input
                            type="text"
                            value={editBirthday}
                            onChange={(e) => setEditBirthday(e.target.value)}
                            placeholder="Ví dụ: 1208 hoặc 12/08"
                            className={`w-full px-3 py-1.5 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans rounded-xl`}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">Ghi chú đặc biệt (Lưu ý)</label>
                          <input
                            type="text"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="Ví dụ: Bối cảnh thế giới tương lai..."
                            className={`w-full px-3 py-1.5 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans rounded-xl`}
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">Danh mục chính / Vai trò phụ</label>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={editCategory}
                              onChange={(e) => setEditCategory(e.target.value)}
                              placeholder="Danh mục chính"
                              className={`w-full px-3 py-1.5 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans rounded-xl`}
                            />
                            <input
                              type="text"
                              value={editRole}
                              onChange={(e) => setEditRole(e.target.value)}
                              placeholder="Vai trò phụ"
                              className={`w-full px-3 py-1.5 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans rounded-xl`}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Avatar and Theme Row */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">AVATAR (EMOJI / LINK ẢNH)</label>
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full border shrink-0 overflow-hidden flex items-center justify-center bg-stone-100 dark:bg-stone-800 border-stone-200 dark:border-stone-700 shadow-inner">
                              {isImageUrl(editAvatar) ? (
                                <img src={formatImageUrl(editAvatar)} alt="Avatar Preview" referrerPolicy="no-referrer" className="w-full h-full object-cover" onError={(e) => handleImageError(e, editName || "Avatar")} />
                              ) : (
                                <span className="text-base select-none">{editAvatar || "👤"}</span>
                              )}
                            </div>
                            <input
                              type="text"
                              value={editAvatar}
                              onChange={(e) => setEditAvatar(e.target.value)}
                              placeholder="Ví dụ: 🐱 hoặc link ảnh..."
                              className={`w-full px-3 py-1.5 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans rounded-xl`}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">CHỦ ĐỀ MÀU</label>
                          <select
                            value={editThemeColor}
                            onChange={(e) => setEditThemeColor(e.target.value)}
                            className={`w-full px-3 py-1.5 bg-white border ${currentPastel.primaryBorderLight} text-xs text-stone-800 ${currentPastel.focusRing} transition-all font-sans rounded-xl`}
                          >
                            {PRESET_THEMES.map(theme => (
                              <option key={theme.value} value={theme.value}>{theme.name}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Action buttons inside Edit Panel */}
                      <div className="flex justify-end space-x-3 pt-4 border-t border-[#eadbca]/30 mt-6">
                        <button
                          type="button"
                          onClick={() => setIsEditMode(false)}
                          className="px-4 py-2 bg-white hover:bg-stone-50 border border-stone-200 text-stone-500 font-sans text-xs font-semibold rounded-full cursor-pointer"
                        >
                          Hủy bỏ
                        </button>
                        <button
                          type="submit"
                          className={`px-5 py-2 ${currentPastel.primaryBtnBg} font-sans text-xs font-bold uppercase rounded-full cursor-pointer shadow-xs`}
                        >
                          Cập nhật nhân vật
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    /* PROFILE SHOW PANEL */
                    <motion.div 
                      key="show-panel"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-6"
                    >
                      {/* Admin edit button */}
                      {currentUserEmail === "nguyenthao19876.64@gmail.com" && (
                        <div className="flex justify-end">
                          <button
                            onClick={() => setIsEditMode(true)}
                            className="px-4 py-1.5 bg-rose-100 text-rose-600 hover:bg-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:hover:bg-rose-900/60 rounded-full text-xs font-bold transition-colors uppercase tracking-wider shadow-sm flex items-center gap-1.5 cursor-pointer border border-rose-200/50 dark:border-rose-900/50"
                          >
                            <span>⚙️</span>
                            <span>Hiệu chỉnh thông tin</span>
                          </button>
                        </div>
                      )}

                      {/* Character Metadata Grid */}
                      {(selectedCharacter.age || selectedCharacter.gender || selectedCharacter.height || selectedCharacter.mbti || selectedCharacter.occupation || selectedCharacter.relationship || selectedCharacter.pronouns || selectedCharacter.zodiac) && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {selectedCharacter.age && (
                            <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-colors ${
                              isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-[#fcfaf7] border-[#eadbca]/50"
                            }`}>
                              <span className="text-[10px] font-sans font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Tuổi</span>
                              <span className="text-sm font-bold font-serif">{selectedCharacter.age}</span>
                            </div>
                          )}
                          {selectedCharacter.gender && (
                            <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-colors ${
                              isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-[#fcfaf7] border-[#eadbca]/50"
                            }`}>
                              <span className="text-[10px] font-sans font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Giới tính</span>
                              <span className="text-sm font-bold font-serif">{selectedCharacter.gender}</span>
                            </div>
                          )}
                          {selectedCharacter.height && (
                            <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-colors ${
                              isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-[#fcfaf7] border-[#eadbca]/50"
                            }`}>
                              <span className="text-[10px] font-sans font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Chiều cao</span>
                              <span className="text-sm font-bold font-serif">{selectedCharacter.height}</span>
                            </div>
                          )}
                          {selectedCharacter.mbti && (
                            <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-colors ${
                              isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-[#fcfaf7] border-[#eadbca]/50"
                            }`}>
                              <span className="text-[10px] font-sans font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">MBTI</span>
                              <span className="text-sm font-bold font-serif">{selectedCharacter.mbti}</span>
                            </div>
                          )}
                          {selectedCharacter.occupation && (
                            <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-colors ${
                              isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-[#fcfaf7] border-[#eadbca]/50"
                            }`}>
                              <span className="text-[10px] font-sans font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Nghề nghiệp</span>
                              <span className="text-sm font-bold font-serif truncate">{selectedCharacter.occupation}</span>
                            </div>
                          )}
                          {selectedCharacter.relationship && (
                            <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-colors ${
                              isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-[#fcfaf7] border-[#eadbca]/50"
                            }`}>
                              <span className="text-[10px] font-sans font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Quan hệ</span>
                              <span className="text-sm font-bold font-serif truncate">{selectedCharacter.relationship}</span>
                            </div>
                          )}
                          {selectedCharacter.pronouns && (
                            <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-colors ${
                              isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-[#fcfaf7] border-[#eadbca]/50"
                            }`}>
                              <span className="text-[10px] font-sans font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Xưng hô</span>
                              <span className="text-sm font-bold font-serif">{selectedCharacter.pronouns}</span>
                            </div>
                          )}
                          {selectedCharacter.zodiac && (
                            <div className={`p-3 rounded-xl border flex flex-col gap-1 transition-colors ${
                              isDarkMode ? "bg-stone-900/40 border-stone-800" : "bg-[#fcfaf7] border-[#eadbca]/50"
                            }`}>
                              <span className="text-[10px] font-sans font-semibold text-stone-400 dark:text-stone-500 uppercase tracking-wider">Cung hoàng đạo</span>
                              <span className="text-sm font-bold font-serif">{selectedCharacter.zodiac}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Main Interaction Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => {
                            if ((selectedCharacter.id === "kaiza-tachibana" || selectedCharacter.id === "tham-da" || selectedCharacter.id === "kanzaki-ren") && ageVerification === "rejected") {
                              return; // Link is locked
                            }
                            if (selectedCharacter.link) {
                              handleGoToLink(selectedCharacter.link);
                            }
                          }}
                          disabled={(selectedCharacter.id === "kaiza-tachibana" || selectedCharacter.id === "tham-da" || selectedCharacter.id === "kanzaki-ren") && ageVerification === "rejected"}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-200 active:scale-95 ${
                            (selectedCharacter.id === "kaiza-tachibana" || selectedCharacter.id === "tham-da" || selectedCharacter.id === "kanzaki-ren") && ageVerification === "rejected"
                              ? "bg-stone-300 text-stone-500 cursor-not-allowed border-stone-300 dark:bg-stone-800 dark:text-stone-600 dark:border-stone-800 opacity-70"
                              : `cursor-pointer ${isDarkMode
                                ? "bg-rose-950 text-rose-300 border border-rose-800 hover:bg-rose-900"
                                : `${currentPastel.primaryBtnBg} ${currentPastel.focusRing}`}`
                          }`}
                        >
                          {((selectedCharacter.id === "kaiza-tachibana" || selectedCharacter.id === "tham-da" || selectedCharacter.id === "kanzaki-ren") && ageVerification === "rejected") ? (
                            <Lock className="w-4 h-4" />
                          ) : (
                            <ExternalLink className="w-4 h-4" />
                          )}
                          <span>{((selectedCharacter.id === "kaiza-tachibana" || selectedCharacter.id === "tham-da" || selectedCharacter.id === "kanzaki-ren") && ageVerification === "rejected") ? "Link đã bị khóa (18+)" : "Nhấp vào đây để tới yêu thương ẻm"}</span>
                        </button>

                        <button
                          onClick={() => {
                            setActiveTab("chat");
                            setChatCharacterId(selectedCharacter.id);
                            setSelectedCharacter(null);
                            playMeowSound();
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-200 active:scale-95 cursor-pointer ${
                            isDarkMode
                              ? "bg-amber-950 text-amber-300 border border-amber-800 hover:bg-amber-900"
                              : "bg-white text-stone-700 border border-[#eadbca] hover:bg-stone-50/50"
                          }`}
                        >
                          <MessageSquare className="w-4 h-4" />
                          <span>Trò chuyện với ẻm</span>
                        </button>

                         <button
                          onClick={(e) => handleToggleFavorite(selectedCharacter.id, e)}
                          className={`py-3 px-6 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-sm transition-all duration-200 active:scale-95 cursor-pointer flex items-center justify-center gap-2.5 border ${
                            selectedCharacter.isFavorite
                              ? "bg-rose-500 text-white border-rose-500"
                              : isDarkMode
                              ? "bg-stone-900 text-stone-300 border-stone-800 hover:bg-stone-800"
                              : "bg-white text-stone-600 border-[#eadbca] hover:bg-stone-50/50"
                          }`}
                        >
                          <Heart className={`w-4 h-4 ${selectedCharacter.isFavorite ? "fill-white" : ""}`} />
                          <span className="flex items-center gap-1.5">
                            <span>{selectedCharacter.isFavorite ? "Đã Thích" : "Thêm Thích"}</span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                              selectedCharacter.isFavorite 
                                ? "bg-white/20 text-white"
                                : "bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400"
                            }`}>
                              {selectedCharacter.favoritesCount || 0}
                            </span>
                          </span>
                        </button>
                      </div>

                      {/* Character Plot & Story details */}
                      <div className="space-y-4">
                        <div className={`border p-5 rounded-2xl shadow-inner transition-colors duration-300 ${
                          isDarkMode ? "bg-stone-950/40 border-stone-800" : `${currentPastel.primaryBgLight}/60 ${currentPastel.primaryBorderLight}`
                        }`}>
                          <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                            <div className={`flex items-center space-x-2 text-[10px] font-sans font-bold tracking-widest uppercase ${
                              isDarkMode ? "text-stone-400" : "text-stone-500"
                            }`}>
                              <Bookmark className="w-3.5 h-3.5" />
                              <span>Phân Loại &amp; Tags:</span>
                            </div>
                            {selectedCharacter.category && (
                              <span className={`text-[9px] uppercase tracking-wider border px-3 py-0.5 rounded-full font-mono font-bold ${
                                isDarkMode 
                                  ? "text-amber-400 border-amber-900/60 bg-amber-950/40" 
                                  : "text-amber-800 border-[#eadbca] bg-amber-50"
                              }`}>
                                {selectedCharacter.category}
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-1.5 transition-all duration-300">
                            {selectedCharacter.tags && selectedCharacter.tags.length > 0 ? (
                              selectedCharacter.tags.map((tag, i) => tag.trim() && (
                                <span 
                                  key={i}
                                  className={`text-[11px] px-2.5 py-1 rounded-full border font-medium select-none shadow-sm tracking-wide transition-all ${
                                    isDarkMode 
                                      ? `${currentPastel.primaryBgDark} ${currentPastel.primaryBorderDark} ${currentPastel.primaryText}` 
                                      : `${currentPastel.primaryBgLight} ${currentPastel.primaryBorderLight} ${currentPastel.primaryText}`
                                  }`}
                                >
                                  {tag.trim()}
                                </span>
                              ))
                            ) : selectedCharacter.plot && (selectedCharacter.plot.includes(',') || selectedCharacter.plot.includes(';')) ? (
                              (selectedCharacter.plot.includes(';') ? selectedCharacter.plot.split(';') : selectedCharacter.plot.split(',')).map((tag, i) => tag.trim() && (
                                <span 
                                  key={i}
                                  className={`text-[11px] px-2.5 py-1 rounded-full border font-medium select-none shadow-sm tracking-wide transition-all ${
                                    isDarkMode 
                                      ? `${currentPastel.primaryBgDark} ${currentPastel.primaryBorderDark} ${currentPastel.primaryText}` 
                                      : `${currentPastel.primaryBgLight} ${currentPastel.primaryBorderLight} ${currentPastel.primaryText}`
                                  }`}
                                >
                                  {tag.trim()}
                                </span>
                              ))
                            ) : (
                              <p className={`text-sm leading-relaxed font-serif italic text-justify transition-colors duration-300 ${
                                isDarkMode ? "text-white" : "text-stone-700"
                              }`}>
                                {selectedCharacter.plot || "Chưa chọn thể loại / tags."}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Detailed Storyline / Cốt truyện chi tiết */}
                        <div className={`border p-5 rounded-2xl shadow-inner transition-colors duration-300 ${
                          isDarkMode ? "bg-stone-950/30 border-stone-800/80" : "bg-[#fcfaf7] border-[#eadbca]/50"
                        }`}>
                          <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
                            <div className={`flex items-center space-x-2 text-[10px] font-sans font-bold tracking-widest uppercase ${
                              isDarkMode ? "text-stone-400" : "text-stone-500"
                            }`}>
                              <BookOpen className="w-3.5 h-3.5 text-rose-400" />
                              <span>Cốt truyện chi tiết:</span>
                            </div>
                            
                            {/* Cỡ chữ controller */}
                            <div className="flex items-center gap-1.5 bg-stone-100 dark:bg-stone-900 rounded-full px-2 py-0.5 border border-stone-200/50 dark:border-stone-800 shadow-2xs select-none">
                              <span className="text-[9px] text-stone-400 dark:text-stone-500 font-bold uppercase tracking-wider pl-1">Cỡ chữ</span>
                              <button 
                                type="button"
                                onClick={() => setStoryFontSize(prev => Math.max(11, prev - 1))}
                                className="w-5 h-5 flex items-center justify-center text-xs font-black rounded-full bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 cursor-pointer active:scale-90"
                                title="Giảm cỡ chữ"
                              >
                                A-
                              </button>
                              <span className="text-[11px] font-bold px-0.5 text-stone-700 dark:text-stone-300 min-w-[22px] text-center font-mono">{storyFontSize}px</span>
                              <button 
                                type="button"
                                onClick={() => setStoryFontSize(prev => Math.min(26, prev + 1))}
                                className="w-5 h-5 flex items-center justify-center text-xs font-black rounded-full bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-700 cursor-pointer active:scale-90"
                                title="Tăng cỡ chữ"
                              >
                                A+
                              </button>
                            </div>
                          </div>

                          {/* Storyline reading progress bar */}
                          {selectedCharacter.storyline && isStoryExpanded && (selectedCharacter.storyline || "").length > 200 && (
                            <div className="flex items-center gap-2 mb-3 bg-stone-100/50 dark:bg-stone-900/40 p-2 rounded-xl border border-stone-200/20 dark:border-stone-800/20">
                              <span className="text-[10px] font-bold font-sans text-stone-400 dark:text-stone-500 uppercase tracking-wider whitespace-nowrap">Đọc được:</span>
                              <div className="flex-1 h-1.5 bg-stone-200 dark:bg-stone-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-rose-400 rounded-full transition-all duration-75 ease-out"
                                  style={{ width: `${storyScrollProgress}%` }}
                                />
                              </div>
                              <span className="text-[10px] font-bold font-mono text-stone-500 dark:text-stone-400 min-w-[32px] text-right">{Math.round(storyScrollProgress)}%</span>
                            </div>
                          )}

                          <div 
                            id="storyline-text" 
                            style={{ fontSize: `${storyFontSize}px` }}
                            onScroll={(e) => {
                              const target = e.currentTarget;
                              const totalHeight = target.scrollHeight - target.clientHeight;
                              if (totalHeight > 0) {
                                const progress = (target.scrollTop / totalHeight) * 100;
                                setStoryScrollProgress(progress);
                              } else {
                                setStoryScrollProgress(0);
                              }
                            }}
                            className={`leading-relaxed font-serif text-justify whitespace-pre-wrap transition-all duration-300 pr-2 scrollbar-thin text-stone-700 dark:text-stone-200 relative ${
                              isStoryExpanded 
                                ? "max-h-96 overflow-y-auto" 
                                : "max-h-32 overflow-hidden"
                            }`}
                          >
                            {selectedCharacter.storyline || "Chưa cập nhật cốt truyện chi tiết cho nhân vật này."}
                            
                            {/* Gradient fade when collapsed */}
                            {!isStoryExpanded && (selectedCharacter.storyline || "").length > 200 && (
                              <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[#fcfaf7] dark:from-[#141211] to-transparent pointer-events-none" />
                            )}
                          </div>

                          {/* Expand / Collapse Button */}
                          {(selectedCharacter.storyline || "").length > 200 && (
                            <div className="flex justify-center mt-3 border-t border-dashed border-stone-200/40 dark:border-stone-800/60 pt-2.5">
                              <button
                                type="button"
                                onClick={() => setIsStoryExpanded(!isStoryExpanded)}
                                className="px-4 py-1.5 bg-stone-100 hover:bg-stone-200 dark:bg-stone-900 dark:hover:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full text-xs font-bold transition-all duration-200 shadow-3xs flex items-center gap-1 cursor-pointer active:scale-95"
                              >
                                {isStoryExpanded ? (
                                  <>
                                    <span>🔼</span>
                                    <span>Thu gọn cốt truyện</span>
                                  </>
                                ) : (
                                  <>
                                    <span>🔽</span>
                                    <span>Xem đầy đủ cốt truyện</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Note / Ghi chú */}
                        {selectedCharacter.note && (
                          <div className={`border p-4 rounded-2xl space-y-2 transition-all duration-300 shadow-xs ${
                            isDarkMode 
                              ? "bg-amber-950/15 border-amber-900/30 text-amber-200" 
                              : "bg-amber-50/50 border-amber-200/50 text-amber-900"
                          }`}>
                            <div className="flex items-center space-x-2 text-[10px] font-sans font-bold tracking-widest uppercase">
                              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                              <span className="font-bold tracking-wider">Lưu ý quan trọng:</span>
                            </div>
                            <p className="text-xs font-sans leading-relaxed text-justify text-justify-inter-character">
                              {selectedCharacter.note}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* FEEDBACKS & REVIEW SECTION */}
                      <div className={`border p-5 rounded-2xl transition-all duration-300 ${
                        isDarkMode ? "bg-stone-950/40 border-stone-800/80" : "bg-[#fcfaf7] border-[#eadbca]/50 shadow-xs"
                      }`}>
                        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                          <span className="text-xs font-bold font-sans uppercase tracking-widest flex items-center gap-1.5 text-rose-500">
                            <span>💬 Bình Luận &amp; Đánh Giá Nhân Vật 📝🌸</span>
                          </span>
                          <span className="text-stone-400 font-mono font-normal text-[11px]">
                            ({(selectedCharacter.feedbacks || []).length} nhận xét)
                          </span>
                        </div>

                        {/* List of Feedbacks */}
                        <div className="max-h-64 overflow-y-auto space-y-3 mb-6 border-b border-dashed border-stone-200/40 dark:border-stone-800/60 pb-4 scrollbar-thin">
                          {!(selectedCharacter.feedbacks) || selectedCharacter.feedbacks.length === 0 ? (
                            <p className="text-stone-400 italic text-center py-6 text-xs font-sans">
                              Chưa có đánh giá nào cho nhân vật này. Hãy là người đầu tiên để lại yêu thương nhé! ✨
                            </p>
                          ) : (
                            selectedCharacter.feedbacks.map((fb) => (
                              <div key={fb.id} className={`p-4 rounded-xl border text-xs relative ${
                                isDarkMode ? "bg-stone-900/80 border-stone-800 text-stone-200" : "bg-white border-stone-100 text-stone-800 shadow-2xs"
                              }`}>
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm">{fb.avatar || "🌸"}</span>
                                    <span className={`font-bold ${currentPastel.primaryText}`}>{fb.author}</span>
                                    {fb.rating && <span className="text-[10px] bg-rose-500/10 text-rose-500 px-1.5 py-0.5 rounded-full font-mono">{fb.rating}</span>}
                                    {fb.starRating && (
                                      <div className="flex items-center gap-0.5 ml-1">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                          <Star key={i} className={`w-3 h-3 ${i < fb.starRating! ? "text-amber-400 fill-amber-400" : "text-stone-300 dark:text-stone-600"}`} />
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    {fb.timestamp && <span className="text-[10px] text-stone-400 font-mono">({fb.timestamp})</span>}
                                    {currentUserEmail === "nguyenthao19876.64@gmail.com" && (
                                      <div className="flex gap-1">
                                        {!fb.adminReply && (
                                          <button
                                            onClick={() => {
                                              setReplyingToFeedbackId(fb.id);
                                              setAdminReplyContent("");
                                            }}
                                            className="text-emerald-500 hover:text-emerald-600 transition-colors p-1 rounded cursor-pointer font-bold text-[10px]"
                                            title="Trả lời"
                                          >
                                            Trả lời
                                          </button>
                                        )}
                                        <button
                                          onClick={() => handleDeleteFeedback(fb.id)}
                                          className="text-stone-400 hover:text-rose-500 transition-colors p-1 rounded cursor-pointer"
                                          title="Xóa bình luận"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                <p className="whitespace-pre-wrap leading-relaxed text-justify text-justify-inter-character font-sans">
                                  {fb.content}
                                </p>
                                {fb.adminReply && (
                                  <div className={`mt-3 p-3 rounded-lg border-l-2 border-emerald-400 ${isDarkMode ? "bg-stone-800" : "bg-stone-50"}`}>
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="font-bold text-emerald-600 dark:text-emerald-400 text-[11px]">HaeAeni-Người Lười Tạo Bot</span>
                                      {fb.adminReplyTimestamp && <span className="text-[9px] text-stone-400 font-mono">({fb.adminReplyTimestamp})</span>}
                                    </div>
                                    <p className="whitespace-pre-wrap leading-relaxed text-justify font-sans text-[11px] italic">
                                      {fb.adminReply}
                                    </p>
                                  </div>
                                )}
                                {replyingToFeedbackId === fb.id && (
                                  <div className="mt-3 space-y-2">
                                    <textarea
                                      value={adminReplyContent}
                                      onChange={(e) => setAdminReplyContent(e.target.value)}
                                      className={`w-full border rounded-xl p-2.5 text-xs outline-none resize-none transition-colors ${
                                        isDarkMode ? "bg-stone-900 border-stone-800 text-stone-200" : "bg-white border-[#eadbca]/50 text-stone-800"
                                      }`}
                                      rows={2}
                                      placeholder="Nhập câu trả lời..."
                                    />
                                    <div className="flex justify-end gap-2">
                                      <button
                                        type="button"
                                        onClick={() => setReplyingToFeedbackId(null)}
                                        className="text-[10px] px-3 py-1.5 rounded-full border border-stone-200 hover:bg-stone-100 dark:border-stone-700 dark:hover:bg-stone-800"
                                      >
                                        Hủy
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleSaveAdminReply(fb.id)}
                                        disabled={!adminReplyContent.trim()}
                                        className="text-[10px] px-3 py-1.5 rounded-full bg-emerald-500 text-white hover:bg-emerald-600 disabled:opacity-50"
                                      >
                                        Gửi
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))
                          )}
                        </div>

                        {/* Add Feedback Form */}
                        <form onSubmit={handleAddFeedback} className="space-y-4 pt-2">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <div>
                              <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">TÊN / BIỆT DANH CỦA BẠN</label>
                              <input
                                type="text"
                                placeholder="Biệt danh ngọt ngào... (mặc định: Nàng ẩn danh 🐰)"
                                value={feedbackAuthor}
                                onChange={(e) => setFeedbackAuthor(e.target.value)}
                                className={`w-full border rounded-xl p-2.5 text-xs outline-none transition-colors ${
                                  isDarkMode ? "bg-stone-900 border-stone-800 text-stone-200" : "bg-white border-[#eadbca]/50 text-stone-800"
                                }`}
                              />
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">CẢM XÚC</label>
                                <select
                                  value={feedbackRating}
                                  onChange={(e) => setFeedbackRating(e.target.value)}
                                  className={`w-full border rounded-xl p-2.5 text-xs outline-none transition-colors ${
                                    isDarkMode ? "bg-stone-900 border-stone-800 text-stone-200" : "bg-white border-[#eadbca]/50 text-stone-800"
                                  }`}
                                >
                                  <option value="❤️">❤️ Siêu thích</option>
                                  <option value="🌸">🌸 Dễ thương</option>
                                  <option value="🌟">🌟 Ấn tượng</option>
                                  <option value="🔥">🔥 Cuốn hút</option>
                                  <option value="🎭">🎭 Bí ẩn</option>
                                </select>
                              </div>
                              <div>
                                <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">ĐÁNH GIÁ SAO</label>
                                <div className="flex items-center gap-1.5 h-10 border rounded-xl px-2.5 bg-white dark:bg-stone-900 border-[#eadbca]/50 dark:border-stone-800">
                                  {Array.from({ length: 5 }).map((_, i) => (
                                    <button
                                      type="button"
                                      key={i}
                                      onClick={() => setFeedbackStarRating(i + 1)}
                                      className="cursor-pointer transition-transform active:scale-90"
                                    >
                                      <Star className={`w-4 h-4 ${i < feedbackStarRating ? "text-amber-400 fill-amber-400" : "text-stone-300 dark:text-stone-600"}`} />
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[9px] font-bold text-stone-500 font-sans uppercase tracking-wider mb-1">NỘI DUNG NHẬN XÉT</label>
                            <textarea
                              rows={3}
                              required
                              placeholder="Hãy gửi những lời khen ngợi, lời nhắn nhủ ngọt ngào cho chàng nhé... ✨"
                              value={feedbackContent}
                              onChange={(e) => setFeedbackContent(e.target.value)}
                              className={`w-full border rounded-xl p-2.5 text-xs outline-none resize-none transition-colors ${
                                isDarkMode ? "bg-stone-900 border-stone-800 text-stone-200" : "bg-white border-[#eadbca]/50 text-stone-800"
                              }`}
                            />
                          </div>

                          <div className="flex justify-end">
                            <button
                              type="submit"
                              className={`${currentPastel.primaryBtnBg} font-bold text-xs py-2 px-5 rounded-full cursor-pointer transition-all flex items-center gap-1.5 shadow-sm active:scale-95`}
                            >
                              GỬI YÊU THƯƠNG ✨🌸
                            </button>
                          </div>
                        </form>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Create/Add Custom Character */}
      
      {/* Modal: Kaven Nyx Locked Alert */}
      <AnimatePresence>
        {kavenLockedAlertOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setKavenLockedAlertOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-sm rounded-3xl p-6 shadow-2xl ${
                isDarkMode ? "bg-stone-900 border border-stone-800 text-stone-200" : "bg-white border border-[#f2e3e3] text-stone-800"
              }`}
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-2">
                  <Lock className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-lg font-serif font-bold">Thông báo</h3>
                <p className="text-sm opacity-80 leading-relaxed pb-4">
                  Em này đang khóa để fix. Nàng kiếm char khác hộ Aeni nhé( ◜‿◝ )♡
                </p>
                <button
                  onClick={() => setKavenLockedAlertOpen(false)}
                  className={`w-full py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${
                    isDarkMode 
                      ? "bg-rose-950 text-rose-300 hover:bg-rose-900" 
                      : "bg-rose-500 text-white hover:bg-rose-600"
                  }`}
                >
                  Đóng
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Donate & Guide to Ggai */}
      <AnimatePresence>
        {isDonateModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsDonateModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
                isDarkMode ? "bg-stone-900 border border-stone-800 text-stone-200" : "bg-white border border-[#f2e3e3] text-stone-800"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800/60 pb-3 mb-4 shrink-0">
                <h3 className="text-lg sm:text-xl font-serif font-bold flex items-center gap-2">
                  <span>💖</span> Ủng Hộ &amp; Hướng Dẫn Chơi Ggai
                </h3>
                <button
                  onClick={() => setIsDonateModalOpen(false)}
                  className="p-1 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-6 scrollbar-thin">
                {/* Section 1: Donate QR */}
                <div className="text-center space-y-3.5">
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-rose-500 font-mono block">
                    Đô na tê ủng hộ tui tại đây 💸💝
                  </span>
                  <div className="w-48 h-52 mx-auto rounded-2xl overflow-hidden border border-rose-100 dark:border-stone-850 p-2 bg-white flex items-center justify-center shadow-md">
                    <img 
                      src={donateQrImg} 
                      alt="Donate QR Code" 
                      className="w-full h-full object-contain rounded-xl"
                    />
                  </div>
                  <p className="text-xs sm:text-sm opacity-75 max-w-sm mx-auto leading-relaxed font-sans font-medium text-center">
                    Có thể donate ủng hộ tui tại đây, cảm ơn vì đã ủng hộ tui ạ
                  </p>
                </div>

                {/* Section 2: Hướng dẫn chơi Ggai */}
                <div 
                  onClick={() => {
                    setIsGgaiGuideOpen(!isGgaiGuideOpen);
                    playMeowSound();
                  }}
                  className={`border rounded-3xl p-6 sm:p-7 transition-all duration-300 cursor-pointer select-none shadow-sm hover:shadow-md hover:scale-[1.02] active:scale-[0.99] ${
                    isGgaiGuideOpen
                      ? isDarkMode 
                        ? "bg-rose-950/20 border-rose-800/80" 
                        : "bg-rose-100/40 border-rose-300/80"
                      : isDarkMode 
                        ? "bg-stone-800/60 border-stone-700/80 hover:bg-stone-800 hover:border-rose-900/60" 
                        : "bg-rose-50/50 border-rose-200/60 hover:bg-rose-100/30 hover:border-rose-300"
                  }`}
                >
                  <div className="w-full flex items-center justify-between font-serif font-black focus:outline-none">
                    <span className="flex items-center gap-3 text-rose-500 dark:text-rose-400 text-base sm:text-lg uppercase tracking-wide">
                      <span className="text-xl sm:text-2xl animate-bounce">📖</span> 
                      <span>Hướng dẫn chơi Ggai</span>
                      <span className="text-[9px] sm:text-[10px] font-sans font-extrabold uppercase tracking-widest bg-rose-500 text-white dark:bg-rose-600 px-2.5 py-0.5 rounded-full animate-pulse shrink-0 ml-1.5">
                        {isGgaiGuideOpen ? "ĐANG MỞ 🤫" : "NHẤP VÀO ĐÂY NÈ 👇"}
                      </span>
                    </span>
                    <ChevronDown className={`w-6 h-6 text-rose-500 transition-transform duration-300 shrink-0 ${isGgaiGuideOpen ? "rotate-180" : ""}`} />
                  </div>

                  <AnimatePresence>
                    {isGgaiGuideOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={(e) => {
                          // Prevent clicks inside the guide content from toggling the accordion
                          e.stopPropagation();
                        }}
                        className="overflow-hidden mt-5 space-y-5"
                      >
                        {/* Sub-item 1: Các bước hướng dẫn chơi */}
                        <div className="border-t border-stone-100 dark:border-stone-800/60 pt-4">
                          <button
                            onClick={() => setIsStepsOpen(!isStepsOpen)}
                            className="w-full flex items-center justify-between text-xs sm:text-sm font-bold text-stone-600 dark:text-stone-300 py-1.5 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-rose-400">➔</span> Mũi tên 1: Các bước hướng dẫn chơi
                            </span>
                            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isStepsOpen ? "rotate-90" : ""}`} />
                          </button>

                          {isStepsOpen && (
                            <div className="mt-3 space-y-6 pl-2.5 border-l-2 border-rose-100 dark:border-stone-800 ml-1.5">
                              {[
                                {
                                  step: "Bước 1",
                                  desc: "Vào link nhân vật có trên page",
                                  img: "https://drive.google.com/file/d/1BwnN83TXQpmKxaNlsUTgLaUZvb2zdWCW/view?usp=drivesdk"
                                },
                                {
                                  step: "Bước 2",
                                  desc: "Nhấn nút 3 chấm phía như ảnh",
                                  img: "https://drive.google.com/file/d/1ZztuSTWL7RfJEJ_mhTGQtWeJvTzmj5SY/view?usp=drivesdk"
                                },
                                {
                                  step: "Bước 3",
                                  desc: "Nhấn \"Mở bằng trình duyệt bên ngoài\"",
                                  img: "https://drive.google.com/file/d/1Laqv-H1iR01pyOzZKHHkP_EPKHPutnCK/view?usp=drivesdk"
                                },
                                {
                                  step: "Bước 4",
                                  desc: "Đợi load ra web Chrome hoặc Cốc Cốc rồi nhấn vào cây bút",
                                  img: "https://drive.google.com/file/d/1yMmHgzFN4KOzrqYxkKlGr5hvcNpK0cP7/view?usp=drivesdk"
                                },
                                {
                                  step: "Bước 5",
                                  desc: "Điền thông tin của user (bản thân nàng) vào. Sau khi điền xong, hãy nhấn nút 2 cái tick",
                                  img: "https://drive.google.com/file/d/1nNOSjtHEUx6phLvRNl5piQmikHe4jpOD/view?usp=drivesdk"
                                },
                                {
                                  step: "Bước 6",
                                  desc: "Kéo xuống, nhập tin nhắn mà bản thân muốn vào khung chat, nhấn nút gửi kế bên cái micro, ghi âm đợi load là thành công",
                                  img: "https://drive.google.com/file/d/1tapKpvCjGKYaGTbAiHdLaoUMqLGd77r9/view?usp=drivesdk"
                                }
                              ].map((stepItem, idx) => (
                                <div key={idx} className="space-y-2.5 border-b border-stone-100/50 dark:border-stone-800/30 pb-5 last:border-0 last:pb-0">
                                  <div className="flex items-start gap-2 text-xs sm:text-sm font-sans font-semibold">
                                    <span className="font-bold text-rose-500 dark:text-rose-400 shrink-0 bg-rose-500/10 px-2 py-0.5 rounded-md text-[11px] sm:text-xs">{stepItem.step}</span>
                                    <span className="opacity-95 pt-0.5 leading-relaxed">{stepItem.desc}</span>
                                  </div>
                                  <div className="rounded-2xl overflow-hidden border border-stone-200/50 dark:border-stone-800/80 bg-stone-50 dark:bg-stone-900/60 p-1.5 max-w-md w-full shadow-xs mx-auto">
                                    <img 
                                      src={formatImageUrl(stepItem.img)} 
                                      alt={stepItem.step} 
                                      className="w-full h-auto object-contain rounded-xl hover:scale-[1.03] transition-transform duration-300"
                                      onError={(e) => {
                                        e.currentTarget.src = "https://ui-avatars.com/api/?name=Step+Image&background=random";
                                      }}
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Sub-item 2: Video hướng dẫn chi tiết */}
                        <div className="border-t border-stone-100 dark:border-stone-800/60 pt-4">
                          <button
                            onClick={() => setIsVideoOpen(!isVideoOpen)}
                            className="w-full flex items-center justify-between text-xs sm:text-sm font-bold text-stone-600 dark:text-stone-300 py-1.5 cursor-pointer"
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-rose-400">➔</span> Mũi tên 2: Video hướng dẫn chi tiết
                            </span>
                            <ChevronRight className={`w-4 h-4 transition-transform duration-300 ${isVideoOpen ? "rotate-90" : ""}`} />
                          </button>

                          {isVideoOpen && (
                            <div className="mt-3 space-y-3">
                              <p className="text-xs sm:text-sm opacity-75 pl-2 leading-relaxed font-medium">
                                Xem video hướng dẫn trực quan để nắm rõ từng thao tác chơi Ggai nhen nàng:
                              </p>
                              <div className="rounded-3xl overflow-hidden border border-stone-200/60 dark:border-stone-800 bg-black aspect-[9/16] max-w-[280px] sm:max-w-[320px] w-full shadow-lg mx-auto relative hover:scale-[1.01] transition-transform duration-300">
                                <iframe 
                                  src="https://drive.google.com/file/d/1sXdTpfLUNTRlr6YLiz7u7GabCsx6bpNq/preview" 
                                  style={{ width: "177.78%" }}
                                  className="absolute top-0 bottom-0 h-full left-1/2 -translate-x-1/2 border-none max-w-none"
                                  allow="autoplay; encrypted-media" 
                                  allowFullScreen
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Section 3: Trừng phạt chủ quán (Khung riêng) */}
                <div 
                  onClick={() => {
                    setIsPunishOpen(!isPunishOpen);
                    playMeowSound();
                  }}
                  className={`border rounded-3xl p-6 sm:p-7 transition-all duration-300 cursor-pointer select-none shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.99] ${
                    isPunishOpen
                      ? isDarkMode 
                        ? "bg-rose-950/20 border-rose-800/80" 
                        : "bg-rose-100/40 border-rose-300/80"
                      : isDarkMode 
                        ? "bg-stone-800/60 border-stone-700/80 hover:bg-stone-800 hover:border-rose-900/60" 
                        : "bg-rose-50/50 border-rose-200/60 hover:bg-rose-100/30 hover:border-rose-300"
                  }`}
                >
                  <div className="w-full flex items-center justify-between font-serif font-black focus:outline-none">
                    <span className="flex items-center gap-3 text-rose-500 dark:text-rose-400 text-base sm:text-lg uppercase tracking-wide">
                      <span className="text-xl sm:text-2xl animate-bounce">😈</span> 
                      <span>Trừng phạt chủ quán</span>
                      <span className="text-[9px] sm:text-[10px] font-sans font-extrabold uppercase tracking-widest bg-rose-500 text-white dark:bg-rose-600 px-2.5 py-0.5 rounded-full animate-pulse shrink-0 ml-1.5">
                        {isPunishOpen ? "ĐANG MỞ 🤫" : "NHẤP VÀO ĐÂY NÈ 👇"}
                      </span>
                    </span>
                    <ChevronDown className={`w-6 h-6 text-rose-500 transition-transform duration-300 shrink-0 ${isPunishOpen ? "rotate-180" : ""}`} />
                  </div>

                  <AnimatePresence>
                    {isPunishOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25 }}
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="overflow-hidden mt-5 space-y-4 flex flex-col items-center"
                      >
                        <div className="border-t border-stone-100 dark:border-stone-800/60 pt-4 w-full flex flex-col items-center gap-4">
                          
                          {/* Punish Image Area */}
                          <div 
                            id="punish-image-container"
                            className={`relative rounded-2xl overflow-hidden border border-rose-200/40 dark:border-stone-800 bg-stone-50 dark:bg-stone-900 p-2 max-w-[400px] w-full shadow-inner mx-auto flex items-center justify-center ${
                              !isLagReduced && isContainerShaking ? "animate-container-shake" : ""
                            }`}
                          >
                            <img 
                              key={punishAnimKey}
                              src={formatImageUrl(
                                punishImageState === "head"
                                  ? "https://drive.google.com/file/d/106e-wmZhbu65ROZucXqlSAQ32t5RPWLV/view?usp=drivesdk"
                                  : punishImageState === "butt"
                                  ? "https://drive.google.com/file/d/1DuOWB6bGH7sHY4nsAw6Xwji-OKyD4n7s/view?usp=drivesdk"
                                  : "https://drive.google.com/file/d/1AZR_C7JCLPQfp3RhWP9sXD0cdVNvhoKv/view?usp=drivesdk"
                              )} 
                              alt="Trừng phạt chủ quán" 
                              onClick={() => {
                                playMeowSound();
                                setPunishImageState("normal");
                                setPunishMessage("Hợ hợ, chủ quán lại lười biếng rồi ~");
                                setPunishAnimKey(prev => prev + 1);
                                triggerContainerShake();
                              }}
                              className={`w-full h-auto object-contain rounded-xl max-h-[250px] cursor-pointer hover:scale-[1.02] transition-transform duration-300 ${
                                !isLagReduced && punishImageState === "head" ? "animate-punish-head" : ""
                              } ${
                                !isLagReduced && punishImageState === "butt" ? "animate-punish-butt" : ""
                              }`}
                              onError={(e) => {
                                e.currentTarget.src = "https://ui-avatars.com/api/?name=Punish+Aeni&background=random";
                              }}
                            />
                          </div>

                          {/* Chat/Text Bubble */}
                          {punishMessage && (
                            <div className={`px-4 py-2.5 rounded-2xl text-center text-xs sm:text-sm font-sans font-bold leading-relaxed border transition-colors shadow-2xs ${
                              isDarkMode 
                                ? "bg-rose-950/40 border-rose-900/40 text-rose-300" 
                                : "bg-rose-50 border-rose-200 text-rose-700"
                            }`}>
                              {punishMessage}
                            </div>
                          )}

                           {/* Buttons Container */}
                          <div className="w-full flex justify-center gap-3">
                            <button
                              type="button"
                              onClick={() => {
                                playSlapSound();
                                playAidaSound();
                                setPunishImageState("head");
                                const headMessages = [
                                  "Ui da, đừng đánh Aeni mà o(TヘTo)",
                                  "Đau đầu tui rồi nè, đền tiền chữa trị đi! 🤕💢",
                                  "Aeni ngốc nghếch đi là tại bạn đánh đó nha! 😡🐾",
                                  "Quýnh đầu hoài hèn chi hết thông minh nổi luôn... (｡•́︿•̀｡)",
                                  "Huhu, u một cục to bự chảng trên đầu rồi nè! 😭🍒",
                                  "Chủ quán đau lắm á, đừng gõ nữa màaa~ 🥺💔"
                                ];
                                const randomMsg = headMessages[Math.floor(Math.random() * headMessages.length)];
                                setPunishMessage(randomMsg);
                                setPunishAnimKey(prev => prev + 1);
                                triggerContainerShake();
                              }}
                              className={`flex-1 max-w-[150px] py-2.5 px-4 rounded-full font-bold font-sans text-xs transition-all duration-200 cursor-pointer shadow-sm active:scale-95 text-center ${
                                isDarkMode 
                                  ? "bg-rose-950/60 hover:bg-rose-900/60 border border-rose-800 text-rose-300" 
                                  : "bg-rose-100 hover:bg-rose-200 border border-rose-200 text-rose-700"
                              }`}
                            >
                              🔨 Đánh đầu
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                playSlapSound();
                                playAidaSound();
                                setPunishImageState("butt");
                                const buttMessages = [
                                  "Đừng quýnh mung tui mà( ᵒ̴̶̷᷄ д ᵒ̴̶̷᷅ )",
                                  "Á! Sàm sỡ chủ quán kìa! Bớ người taaaa! 📢😳",
                                  "Đánh mông là hư lắm á nha! Không thương bạn nữa đâu! 🍑💢",
                                  "Mông tui sưng vêu lên như quả đào chín rồi này! 🍑😿",
                                  "Hự! Đau mung quạ... Ai cho gõ vào chỗ nhạy cảm thế hả?! (⁄ ⁄•⁄ω⁄•⁄ ⁄)",
                                  "Bớ người ta chủ quán bị tét mung, cứu mị vớiiiii! 🚑😭"
                                ];
                                const randomMsg = buttMessages[Math.floor(Math.random() * buttMessages.length)];
                                setPunishMessage(randomMsg);
                                setPunishAnimKey(prev => prev + 1);
                                triggerContainerShake();
                              }}
                              className={`flex-1 max-w-[150px] py-2.5 px-4 rounded-full font-bold font-sans text-xs transition-all duration-200 cursor-pointer shadow-sm active:scale-95 text-center ${
                                isDarkMode 
                                  ? "bg-amber-950/60 hover:bg-amber-900/60 border border-amber-800 text-amber-300" 
                                  : "bg-amber-100 hover:bg-amber-200 border border-amber-200 text-amber-700"
                              }`}
                            >
                              🍑 Đánh mung
                            </button>
                          </div>

                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-stone-100 dark:border-stone-800/60 pt-3 mt-4 flex justify-end shrink-0">
                <button
                  onClick={() => setIsDonateModalOpen(false)}
                  className={`py-2 px-5 rounded-full font-bold text-xs transition-all cursor-pointer ${
                    isDarkMode 
                      ? "bg-stone-800 hover:bg-stone-700 text-stone-200" 
                      : "bg-rose-500 hover:bg-rose-600 text-white"
                  }`}
                >
                  Đóng nhen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Standalone Dedicated Modal: Sẵn Profile User */}
      <AnimatePresence>
        {isUserProfilePresetsModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsUserProfilePresetsModalOpen(false)}
              className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className={`relative w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col ${
                isDarkMode ? "bg-stone-900 border border-stone-800 text-stone-200" : "bg-white border border-[#f2e3e3] text-stone-800"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-stone-100 dark:border-stone-800/60 pb-3 mb-4 shrink-0">
                <h3 className="text-lg sm:text-xl font-serif font-bold flex items-center gap-2 text-purple-600 dark:text-purple-400">
                  <span className="text-xl sm:text-2xl animate-bounce">👤</span> 
                  <span>Sẵn Profile User</span>
                </h3>
                <button
                  onClick={() => setIsUserProfilePresetsModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto pr-1 space-y-5 scrollbar-thin">
                <p className="text-xs sm:text-sm opacity-80 leading-relaxed font-sans font-medium">
                  Dưới đây là các mẫu Hồ sơ User có sẵn. Bạn có thể nhấn mở rộng/thu gọn từng khung và dùng nút <strong>"Sao chép toàn bộ"</strong> để copy nguyên mẫu dán vào khung chat hoặc hồ sơ của mình nhen!
                </p>

                {/* Sub-card 1: Khung Profile User Nữ */}
                <div className="border border-pink-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900/80 p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-pink-100 dark:border-stone-800 pb-3 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsFemaleProfileOpen(!isFemaleProfileOpen)}
                      className="flex items-center gap-2 text-xs sm:text-sm font-bold text-pink-600 dark:text-pink-400 cursor-pointer"
                    >
                      <span>♀️ Khung Profile User Nữ ({FEMALE_USER_PROFILES.length} mẫu)</span>
                      <span className="text-[10px] bg-pink-100 dark:bg-pink-950 text-pink-600 dark:text-pink-300 px-2.5 py-0.5 rounded-full font-mono">
                        {isFemaleProfileOpen ? "Thu gọn ▲" : "Mở rộng ▼"}
                      </span>
                    </button>
                  </div>

                  {isFemaleProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      {FEMALE_USER_PROFILES.map((profile) => {
                        const isItemOpen = expandedPresetItems[profile.id] !== false;
                        return (
                          <div
                            key={profile.id}
                            className="border border-pink-100 dark:border-stone-800 rounded-xl bg-pink-50/30 dark:bg-stone-950/40 p-3.5 space-y-3"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => togglePresetItem(profile.id)}
                                className="flex items-center gap-2 text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer"
                              >
                                <span className="bg-pink-500/15 text-pink-600 dark:text-pink-300 px-2 py-0.5 rounded-md font-mono text-[11px]">
                                  {profile.badge}
                                </span>
                                <span>{profile.name}</span>
                                <span className="text-[10px] text-stone-400 font-mono">
                                  {isItemOpen ? "▲" : "▼"}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopyProfile(profile.id, profile.name, profile.text)}
                                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 ${
                                  copiedProfileType === profile.id
                                    ? "bg-emerald-500 text-white"
                                    : "bg-pink-500 hover:bg-pink-600 text-white dark:bg-pink-600 dark:hover:bg-pink-500"
                                }`}
                              >
                                {copiedProfileType === profile.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Đã sao chép!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Sao chép toàn bộ 📋</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {isItemOpen && (
                              <div className="overflow-x-auto">
                                <pre className="p-3.5 sm:p-4 rounded-xl bg-pink-50/70 dark:bg-stone-950/80 border border-pink-100 dark:border-stone-800 text-[11px] sm:text-xs font-mono text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap font-semibold selection:bg-pink-200 selection:text-pink-900">
                                  {profile.text}
                                </pre>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>

                {/* Sub-card 2: Khung Profile User Nam */}
                <div className="border border-blue-200 dark:border-stone-800 rounded-2xl bg-white dark:bg-stone-900/80 p-4 sm:p-5 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-blue-100 dark:border-stone-800 pb-3 flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setIsMaleProfileOpen(!isMaleProfileOpen)}
                      className="flex items-center gap-2 text-xs sm:text-sm font-bold text-blue-600 dark:text-blue-400 cursor-pointer"
                    >
                      <span>♂️ Khung Profile User Nam ({MALE_USER_PROFILES.length} mẫu)</span>
                      <span className="text-[10px] bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-300 px-2.5 py-0.5 rounded-full font-mono">
                        {isMaleProfileOpen ? "Thu gọn ▲" : "Mở rộng ▼"}
                      </span>
                    </button>
                  </div>

                  {isMaleProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-4"
                    >
                      {MALE_USER_PROFILES.map((profile) => {
                        const isItemOpen = expandedPresetItems[profile.id] !== false;
                        return (
                          <div
                            key={profile.id}
                            className="border border-blue-100 dark:border-stone-800 rounded-xl bg-blue-50/30 dark:bg-stone-950/40 p-3.5 space-y-3"
                          >
                            <div className="flex items-center justify-between flex-wrap gap-2">
                              <button
                                type="button"
                                onClick={() => togglePresetItem(profile.id)}
                                className="flex items-center gap-2 text-xs font-bold text-stone-800 dark:text-stone-200 cursor-pointer"
                              >
                                <span className="bg-blue-500/15 text-blue-600 dark:text-blue-300 px-2 py-0.5 rounded-md font-mono text-[11px]">
                                  {profile.badge}
                                </span>
                                <span>{profile.name}</span>
                                <span className="text-[10px] text-stone-400 font-mono">
                                  {isItemOpen ? "▲" : "▼"}
                                </span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleCopyProfile(profile.id, profile.name, profile.text)}
                                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-1.5 rounded-xl transition-all cursor-pointer shadow-xs active:scale-95 ${
                                  copiedProfileType === profile.id
                                    ? "bg-emerald-500 text-white"
                                    : "bg-blue-500 hover:bg-blue-600 text-white dark:bg-blue-600 dark:hover:bg-blue-500"
                                }`}
                              >
                                {copiedProfileType === profile.id ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" />
                                    <span>Đã sao chép!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" />
                                    <span>Sao chép toàn bộ 📋</span>
                                  </>
                                )}
                              </button>
                            </div>

                            {isItemOpen && (
                              <div className="overflow-x-auto">
                                <pre className="p-3.5 sm:p-4 rounded-xl bg-blue-50/70 dark:bg-stone-950/80 border border-blue-100 dark:border-stone-800 text-[11px] sm:text-xs font-mono text-stone-800 dark:text-stone-200 leading-relaxed whitespace-pre-wrap font-semibold selection:bg-blue-200 selection:text-blue-900">
                                  {profile.text}
                                </pre>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-stone-100 dark:border-stone-800/60 pt-3 mt-4 flex justify-end shrink-0">
                <button
                  onClick={() => setIsUserProfilePresetsModalOpen(false)}
                  className={`py-2 px-5 rounded-full font-bold text-xs transition-all cursor-pointer ${
                    isDarkMode 
                      ? "bg-stone-800 hover:bg-stone-700 text-stone-200" 
                      : "bg-purple-600 hover:bg-purple-700 text-white"
                  }`}
                >
                  Đóng nhen
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating Incoming Secret Phone Message Push Notification Toast */}
      <AnimatePresence>
        {incomingNoti && (
          <motion.div
            initial={{ opacity: 0, x: 80, y: 30, scale: 0.9 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.85, x: 30, transition: { duration: 0.25 } }}
            className="fixed bottom-6 right-6 sm:right-12 z-[100] w-full max-w-[340px] bg-white/95 dark:bg-stone-900/95 border border-[#eadbca]/50 dark:border-stone-800 backdrop-blur-md rounded-2xl shadow-2xl p-4 flex flex-col gap-3.5"
          >
            {/* Header of push notification */}
            <div className="flex justify-between items-center text-[10px] font-bold text-stone-400 font-mono uppercase tracking-widest border-b border-stone-100 dark:border-stone-800/60 pb-1.5">
              <span className="flex items-center gap-1 text-rose-500">
                <span className="animate-pulse">💬</span> MeoChat • Vừa xong
              </span>
              <span>Tin Nhắn 📲</span>
            </div>

            {/* Message Body */}
            <div className="flex gap-3 items-start">
              <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border-2 border-rose-300 shadow-inner">
                {isImageUrl(incomingNoti.avatar) ? (
                  <img src={formatImageUrl(incomingNoti.avatar)} alt={incomingNoti.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-rose-50 flex items-center justify-center text-2xl">{incomingNoti.avatar}</div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h5 className="text-[12px] font-bold font-serif text-stone-800 dark:text-stone-100">{incomingNoti.name}</h5>
                <p className="text-[11px] leading-relaxed text-stone-600 dark:text-stone-300 mt-0.5 italic">
                  "{incomingNoti.content}"
                </p>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setIncomingNoti(null)}
                className="flex-1 py-1.5 border border-stone-200 dark:border-stone-800 hover:bg-stone-50 dark:hover:bg-stone-850 rounded-full text-[10.5px] font-bold font-sans tracking-wide transition-all cursor-pointer text-stone-500 dark:text-stone-400 active:scale-95"
              >
                Để sau ❌
              </button>
              <button
                onClick={() => {
                  playMeowSound();
                  setActiveTab("chat");
                  setChatCharacterId(incomingNoti.charId);
                  setIncomingNoti(null);
                }}
                className="flex-[1.5] py-1.5 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-full text-[10.5px] font-bold font-sans tracking-wide shadow-md active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-1"
              >
                <span>Phúc đáp nhen 💖</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
