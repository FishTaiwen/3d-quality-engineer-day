(function(root){
  'use strict';
  const o=(label,text,delta={},extra={})=>({label,text,delta,...extra});
  const e=(id,station,role,title,body,options)=>({id,station,role,title,body,options});
  const good=(label,text,extra={})=>o(label,text,{quality:7,stress:4,credit:5,downtime:10},extra);
  const fast=(label,text,extra={})=>o(label,text,{quality:-9,stress:-3,credit:-4},extra);
  const roles={QE:['品質工程','大家的問題，都有你的分機。'],IQC:['進料檢驗','箱子可以混，批號不行。'],SQE:['供應商品質','以前都可以，不是量測單位。'],PQE:['製程品質','量測有基準，催件沒有。'],IPQC:['製程巡檢','你一轉身，參數也轉身。'],FQC:['最終檢驗','最後一道防線，最後下班。'],CQE:['客戶品質','先有證據，再有承諾。'],OQC:['出貨檢驗','封箱前，事情總會再長出來。']};
  const stations={
    desk:{name:'品質辦公桌',npc:'品保窗口',x:-17,z:10,color:'#e8b66e',hint:'你的清單、你的待辦、你的咖啡。'},
    incoming:{name:'IQC 進料區',npc:'倉儲窗口',x:-18,z:-10,color:'#81c7ad',hint:'混箱不會自己恢復成批號。'},
    supplier:{name:'供應商窗口',npc:'外包窗口',x:-18,z:-1,color:'#ac9bd4',hint:'「以前都可以」今天也來了。'},
    cnc:{name:'CNC / CMM',npc:'量測窗口',x:-6,z:-10,color:'#8dbad9',hint:'數字很客觀，基準要先確認。'},
    weld:{name:'焊接巡檢區',npc:'製程窗口',x:-6,z:-1,color:'#e79767',hint:'交班不是一句「都正常」。'},
    rd:{name:'研發 / EC',npc:'研發窗口',x:0,z:8,color:'#d2b57c',hint:'檔名的「最新」不是版本號。'},
    gate:{name:'換裝閘門',npc:'管制區終端',x:9,z:-6,color:'#8dd1d2',hint:'進場要換服，責任不用換。'},
    test:{name:'液冷測試站',npc:'測試窗口',x:18,z:-10,color:'#83cdbf',hint:'Manifold / 氣密 / 沉水紀錄。'},
    customer:{name:'CQE 客訴窗口',npc:'業務窗口',x:-7,z:10,color:'#d09aab',hint:'有些承諾，比保固活得久。'},
    shipping:{name:'機櫃出貨區',npc:'物流窗口',x:17,z:8,color:'#d2c284',hint:'車到了，條件呢？'},
    lunch:{name:'茶水間',npc:'便當保衛站',x:5,z:13,color:'#b4c893',hint:'微波爐有結束時間，你也應該有。'},
    exit:{name:'下班門禁',npc:'交接終端',x:22,z:15,color:'#90b894',hint:'下班，是一個完整的句子。'},
    home:{name:'家裡的筆電',npc:'手機群組',x:-3,z:-3,color:'#e9b578',hint:'人回家了，分機沒有。'}
  };
  const legacyBody='某國際指標品牌又來追液冷異常。序號顯示已過保，近期沒有新訂單，同一案件已有多次支援紀錄。\n業務窗口說：「這個品牌不能得罪，以後可能還有機會。」';
  function contact(id='legacy') {return e(id,'customer','CQE','保固到期，群組仍然有效。',legacyBody,[
    good('先確認現有案件的證據與回覆節點','你沒有把品牌大小當成品質證據。先把當前案件接清楚。'),
    o('查閱歷次承諾與服務範圍','你找到一整排「本次協助」。保固結束了，免費支援沒有結束條件。',{stress:6,credit:3},{trigger:'brand',requiredRole:'CQE'}),
    fast('品牌很大，先答應今晚全部處理','你先交出了今晚，還沒有拿到完整資料。',{flag:'unlimited'})
  ]);}
  const costume=(id,title,body,flag)=>e(id,'test','FQC',title,body,[
    o('先登錄缺件，出站取回必要資料','你才剛穿好無塵服。終端顯示：必要資料位於管制區外。現在需要把自己拆裝一次。',{stress:6,downtime:8},{flag}),
    o('向窗口確認缺件，再出去補齊','你確認這次缺的是什麼。至少下一次換裝，不必再靠猜。',{stress:2,credit:4,downtime:10},{flag})
  ]);
  const verify=e('verified','test','FQC','第二次換裝，終於可以查真的資料。','Manifold、QD 座、氣密與沉水紀錄都在。這次要把測試結果接回序號，而不是只看「完成」。',[
    good('核對序號、條件、紀錄與待釐清事項','結果與序號終於相連。氣密通過，不代表文件可以漏氣。',{flag:'evidence'}),
    fast('只看測試完成就放行','完成欄位很整齊，證據仍然散落在各處。')
  ]);
  const lunch=e('lunch','lunch','QE','便當重新申請了使用權。','群組說「五分鐘」。微波爐已經回答你三次五分鐘了。',[
    o('指定急件窗口，先吃飯','你留下回覆時間與接手窗口。便當終於不用陪同處理異常。',{stress:-12,credit:4},{flag:'handoff'}),
    o('帶著便當繼續跑現場','工作與午餐完成了合併，只有你沒有完成休息。',{stress:9,credit:1})
  ]);
  const off=e('off','exit','QE','門禁能刷出去，群組不保證。','表定下班到了。「只問一下，不算加班吧？」手機比門禁更積極。',[
    o('留下完整交接，關閉通知離場','你寫下誰、何時、需要確認什麼。事情可以沒做完，責任不能沒交接。',{stress:-10,credit:5},{finish:true,flag:'left'}),
    o('接電話，真的只問一下','夜間支援已啟用。你把辦公室縮成一台筆電帶回家。',{stress:8},{night:true})
  ]);
  const routes={
    trace:{name:'消失的序號',subtitle:'測試沒有漏，追溯漏了一整排。',code:'TRACE / R-00',color:'#83cdbf',events:[
      e('trace-start','desk','QE','今天的任務：把零件找回它的名字。','示範批次 R-00 要交付。Manifold 與 QD 座的測試紀錄對不上序號。先到進料區追箱號。',[good('建立待查清單，從進料追起','你先標出缺少的關聯。今天不是找一張紙，是找整條責任鏈。'),fast('先答應準時交付，資料晚點補','交期已承諾，證據尚未報到。')]),
      e('trace-in','incoming','IQC','混箱不是一種組裝方法。','外箱 A 批、內袋 B 批。倉儲窗口：「外觀都一樣。」',[good('保留混箱並重建箱號對照','批號留下了，催件信也留下了。'),fast('看起來相同，先入庫','箱子進去了，問題跟著進去了。')]),
      e('trace-supplier','supplier','SQE','這份外包紀錄，主詞是「應該」。','加工件送回來，紀錄寫同上。外包窗口用一張沒有批號的照片當佐證。',[good('要求原始紀錄與 NCR / CAR 窗口','照片終於不必一個人證明整批零件。'),fast('接受電話保證','「我們會注意」再次被當成一張有效附件。')]),
      e('trace-cmm','cnc','PQE','CMM 很精準，附件很自由。','量測基準、加工批次與夾治具版本不在同一份紀錄裡。',[good('接回量測與加工關聯','你為數字找到了出處。'),fast('沿用昨天報告','昨天沒有量今天的零件。')]),
      costume('trace-suit','無塵服穿好了，清單還在你桌上。','測試窗口看著剛換裝的你：「序號清單在你辦公桌上。你沒有帶嗎？」\n換裝系統很完整，訊息系統比較隨性。','missingList'),
      e('trace-desk','desk','QE','這張紙，成功讓你穿了兩次衣服。','辦公桌上的序號清單還壓在咖啡杯下面。先把它接到共用案件，再回測試站。',[good('帶回清單並放入共用案件','下一個人不必靠你的咖啡杯追溯。',{flag:'listReady'}),o('只帶紙本回去','今天的你拿到了，明天的人還需要找到你。',{quality:2,stress:3},{flag:'listReady'})]),
      verify,
      e('trace-ec','rd','QE','「最新_真的」不是管制版次。','EC 履歷出現過切換，但現場使用版本沒有一致。',[good('封存履歷，核對切換點','不是你記錯，是版本有紀錄可以查。',{flag:'archive'}),fast('請 RD 口頭選一份','版本管制暫時由記憶力代理。')]),
      contact('trace-contact'),
      e('trace-ship','shipping','OQC','標籤是零件最後一張身分證。','出貨清單差一碼，QD 保護蓋少兩個。',[good('補齊標籤與保護，留下追蹤','車晚了一點，序號沒有消失。'),fast('留照片先上車','照片不會替 QD 長出保護蓋。')]),lunch,off
    ]},
    shipping:{name:'今天一定要出貨',subtitle:'車在門口，出貨條件還在會議裡。',code:'SHIP / R-00',color:'#e8b66e',events:[
      e('ship-start','desk','QE','今天的品質目標：跟上卡車。','機櫃示範批要出貨。物流說車已排，產線說快好了，品質說還沒看到紀錄。',[good('建立出貨條件清單','時刻表與檢驗規格，終於放在兩個欄位。'),fast('承諾今天一定上車','「一定」成了今天唯一確認過的條件。')]),
      e('ship-in','incoming','IQC','QD 到了，標籤沒有一起到。','來料 QD 座標示不清。窗口希望用外觀決定批次。',[good('保留來料，確認標示與批次','外觀不能替序號回答問題。'),fast('憑經驗配套','經驗很多，配法也很多。')]),
      e('ship-weld','weld','IPQC','焊接交班只有「都正常」。','參數版次與首件紀錄沒有接到新班。',[good('確認版本與首件再續作','今天的製程不用再猜上一班的意思。'),fast('看焊道漂亮就簽','你的名字是唯一留下的製程參數。')]),
      e('ship-rd','rd','PQE','特採只寫暫時。暫時沒有日曆。','研發特採未填批次範圍與期限，現場已開始準備。',[good('補批次、限制與核准紀錄','特採有了邊界，下一批不會自動繼承。'),fast('沿用上一張特採','上一張單獲得無限續約。')]),
      costume('ship-suit','換好無塵服，排程剛取消。','測試窗口：「這批先不用測了，去問研發。」\n你走到門口，手機補一句：「可能等一下又要。」','scheduleCancelled'),
      e('ship-back','rd','QE','取消的是排程，不是你的換裝次數。','研發確認仍需完成測試。先確認批次與排程再重新進站。',[good('確認恢復排程與責任窗口','排程恢復。你的工作服，也恢復了兩次。',{flag:'scheduleReady'}),o('再問一次就回測試站','這次有答案，希望有效期限長一點。',{quality:2,stress:4},{flag:'scheduleReady'})]),
      verify,contact('ship-contact'),
      e('ship-final','shipping','OQC','機櫃完整，保護蓋不完整。','箱標、包材、QD 保護與清單都要確認。卡車不会幫忙做這一段。',[good('補齊出貨條件，寫明未結事項','車可以等一下，問題不能偽裝成已解決。',{flag:'shipReady'}),fast('貼上急件標籤，先出','急件標籤不是品質護身符。')]),lunch,off
    ]},
    customer:{name:'客戶說漏了',subtitle:'照片還沒看清楚，責任已經看向你。',code:'CASE / LC-00',color:'#d09aab',events:[
      e('customer-start','desk','QE','第一封信：品保說明一下。','客戶回報液冷迴路異常。先整理已知與未知，再查出貨和測試。',[good('整理證據清單與回報節點','你沒有用回覆速度取代根因確認。'),fast('承諾今晚完整 8D','原因還沒找到，截止時間已經找到了。',{flag:'promised8d'})]),
      contact('customer-contact'),
      e('customer-ship','shipping','OQC','出貨照片很漂亮，批號很模糊。','客訴照片需要接回實際出貨序號，不能只靠外觀認親。',[good('核對原始出貨與標籤紀錄','序號找到自己的旅程。'),fast('用照片推定批次','你替一張照片補上它沒拍到的資訊。')]),
      e('customer-supplier','supplier','SQE','外包窗口的改善：請你相信。','歷次外包加工異常還有一份沒有驗證的 CAR。',[good('核對原因、改善與驗證證據','改善從一句話變成需要證明的事。'),fast('對方說改善完成，就結案','完成兩個字，沒有自動附帶證據。')]),
      e('customer-cmm','cnc','PQE','量測與客訴不在同一個資料夾。','CMM 紀錄要與客訴批次對照；目前看到的是另一批。',[good('確認批次與量測適用範圍','資料不再因為看起來漂亮，就被用在錯的地方。'),fast('挑一份合格報告回覆','報告過關了，對應關係沒有。')]),
      costume('customer-suit','剛換好，客戶換了一張照片。','最新照片顯示另一種 QD 座。你目前查的批次可能不是對方的。\n客戶的滑鼠點一下，你的無塵服換兩次。','photoChanged'),
      e('customer-back','customer','CQE','先問序號，不先問誰的錯。','確認新照片的序號與使用條件，再回液冷站。',[good('取得序號，區分已知與待確認','批次確認了，話也不用先說滿。',{flag:'photoReady'}),o('請窗口確認後再測','你留下必須確認的欄位，避免再換一次衣服。',{quality:3,stress:2},{flag:'photoReady'})]),
      verify,
      e('customer-rd','rd','QE','異常調查，不是免費變更設計。','客戶希望順便修改舊設計。這需要另一個變更評估，而不是附在客訴信末。',[good('拆開異常調查與 EC 變更','兩件事各自有了負責人與核准範圍。',{flag:'archive'}),fast('先答應順便修改','順便兩個字，容納了一個新專案。')]),lunch,off
    ]},
    brand:{name:'保固過了，服務沒有下班',subtitle:'保固已到期，品保仍有效。',code:'HIDDEN / VIP-00',color:'#bd8fd0',hidden:true,events:[
      e('brand-records','customer','CQE','「本次協助」已經協助了很多次。',legacyBody+'\n你翻開歷史承諾：每封信都說是最後一次。',[
        good('整理保固、訂單、歷次承諾與支援成本','你整理了資訊；過保不會替異常原因做判定。',{flag:'history'}),
        fast('品牌很大，先全部免費承接','費用沒有，期限沒有，只有你的名字。',{flag:'unlimited'})]),
      e('brand-business','customer','CQE','先幫忙，費用後面再談。','業務窗口說未來可能下單。例外服務沒有核准單，未來訂單也沒有單號。',[
        good('建立服務範圍、費用與例外核准窗口','關係有人維持，例外有人核准。',{flag:'scope'}),
        o('追問商務機會單號與進度，登錄支援成本','「未來訂單」終於變成需要更新進度的項目。',{credit:5,stress:5},{flag:'orderEvidence'}),
        fast('先說好，明天再談費用','明天的你收到一個沒有上限的今天。',{flag:'unlimited'})]),
      costume('brand-suit','換好無塵服，客戶還沒有給序號。','測試窗口問序號。業務窗口傳來一張多年前的照片。\n圖片解析度很低，品牌地位很高。請出站向 CQE 窗口追資料。','brandMissing'),
      e('brand-fetch','customer','CQE','有頭有臉，還需要有序號。','對方希望你先測、先報告、先到場；但缺少對應產品與使用資訊。',[
        good('列出必要資料，約定窗口與回覆節點','資料要求不是拒絕客戶，是讓調查能開始。',{flag:'brandReady'}),
        o('以現有資訊建立待驗證清單','你沒有捏造序號，回覆明確標示哪些還不能判定。',{quality:2,stress:4},{flag:'brandReady'}),
        fast('拿相似產品先出完整報告','報告完成得比事實早。',{flag:'brandReady',flag2:'unlimited'})]),
      e('brand-test','test','FQC','重測、到場、完整 8D，全部順便。','Manifold 測試需要建立適用範圍。客戶的「順便」正在擴大成你的第二份工作。',[
        good('完成適用證據，列出仍待確認的原因','你沒有把免費服務與品質事實綁成同一件事。',{flag:'brandEvidence'}),
        fast('為品牌寫一份完整漂亮的根因','漂亮不等於驗證完成。',{flag:'unlimited'})]),
      e('brand-rd','rd','QE','客訴信末長出了一次改版。','客戶要把過保設計改成新規格。需區分原異常與新增服務。',[
        good('拆開異常、設計變更與付費/例外服務','各項工作有了範圍、責任與結束條件。',{flag:'scope'}),
        o('建立例外成本與機會追蹤，取得核准','你讓每次「先幫忙」都能找到核准人與成本。',{quality:4,credit:6,stress:4},{flag:'orderEvidence',flag2:'scope'}),
        fast('品牌不能得罪，全部包在客訴裡','新增需求被裝進沒有底的案件。',{flag:'unlimited'})]),
      e('brand-reply','customer','CQE','回覆的語氣，可以禮貌；範圍，必須清楚。','對方高層關注。今晚希望收到完整回覆，業務希望你不要提費用。',[
        good('回覆證據、支援範圍、核准與下一個節點','你沒有拒絕關係，也沒有承諾無限。',{flag:'professional'}),
        o('直接回覆過保，不再處理','你沒有完成異常與歷史承諾確認，就把對話關上。',{quality:-6,credit:-18,stress:2},{flag:'refused'}),
        fast('承諾全部免費並今晚完成','晚餐、睡眠、明天的你，全部進入服務範圍。',{flag:'unlimited'})]),
      e('brand-off','exit','QE','客戶沒下單，你還有一個原案沒交接。','隱藏任務接管了今天，原工作日的未結事項仍在。要讓下一個人知道發生了什麼。',[
        o('交接原案與支援責任，留下核准紀錄後離場','你保留客戶關係，也留下可接手的工作。至少「先幫忙」不再只花你的晚上。',{stress:-10,credit:7},{finish:true,flag:'originalHanded'}),
        o('接高層追問，回家繼續處理','品牌名稱很大，手機螢幕很小，今晚還是裝得下你。',{stress:12},{night:true,flag:'unlimited'})])
    ]}
  };
  const quests={
    supplier:{name:'供應商 CAR 閉環',reward:{quality:4,credit:6},events:[
      e('side-car1','supplier','SQE','口頭改善，不支援查詢。','留下異常範圍、回覆期限與責任窗口。',[good('建立 CAR 追蹤','改善有了單號，不只有「收到」。')]),
      e('side-car2','cnc','PQE','改善完成，需要量測證據。','核對供應商改善後的量測與適用批次。',[good('確認量測依據','完成有了證據，下一步是追蹤。')]),
      e('side-car3','shipping','OQC','交貨不代表改善自動結案。','把後續驗證與未結事項接到交付窗口。',[good('建立改善驗證節點','這次的結案有責任窗口。')])]},
    trace:{name:'批次追溯補完',reward:{quality:4,credit:6},events:[
      e('side-trace1','incoming','IQC','箱號有名字，零件也要有。','建立箱號與批次關聯。',[good('建立箱號對照','第一段追溯留住了。')]),
      e('side-trace2','test','FQC','架子記得，不等於系統記得。','進管制區核對測試與序號，需先換無塵服。',[good('補測試序號關聯','第二段追溯接好了。')]),
      e('side-trace3','rd','QE','版本也有它的旅程。','核對 EC 切換時間與使用批次。',[good('保存版本與批次時間線','追溯不用再從你的腦袋開始。',{flag:'archive'})])]},
    boundary:{name:'便當保衛戰',reward:{stress:-8,credit:6},events:[
      e('side-lunch1','lunch','QE','便當不需要特採。','指定急件窗口，保留午餐時間。',[o('留下回覆時間再吃飯','這份熱食，有人守住。',{stress:-8,credit:3})]),
      e('side-lunch2','customer','CQE','全天候，是一種服務範圍。','建立客訴接手與回報節點。',[o('指定窗口，不讓自己永遠在線','回覆節點接住了下一段。',{stress:-4,credit:4})]),
      e('side-lunch3','exit','QE','交接要真的有人接。','確認窗口收到清單，不只是把信寄出去。',[o('確認接手與聯絡範圍','下班可以是一個完整的句子。',{stress:-5,credit:4},{flag:'handoff'})])]}
  };
  const random=[
    e('random-cmm','cnc','PQE','校驗到期，儀器本人沒有表示。','排程沒有空檔，校驗狀態需要確認。',[good('保留影響批次並確認有效狀態','儀器很安靜，紀錄開始說話。'),fast('貼一張明天處理的便條','日期更新了，有效狀態沒有。')]),
    e('random-photo','incoming','IQC','只有檔案大小很清楚。','照片模糊，檔名是正常.jpg。',[good('補批號與原始紀錄','檔案開始能證明它在拍什麼。'),fast('檔名正常就判正常','正常只是檔案的名字。')]),
    e('random-copy','weld','IPQC','今天的紀錄連錯字都跟昨天一樣。','填寫率100%，可信度另計。',[good('確認巡檢與補正紀錄','格子還是滿的，內容終於是今天的。'),fast('系統通過就完成','系統沒有看到現場。')]),
    e('random-box','shipping','OQC','紙箱很吸水，也很吸責任。','底層包材受潮，外面摸起來乾了。',[good('更換包材並確認保存','紙箱換了，原因有人追。'),fast('外層再包一圈','包裝厚了，問題還在。')]),
    e('random-waiver','rd','QE','暫時的有效期：直到有人想起來。','RD 特採沒有範圍與期限。',[good('補範圍、期限與核准','暫時有了結束條件。'),fast('沿用上一張特採','上一張又加了一天班。')]),
    e('random-supplier','supplier','SQE','異常解釋，比零件先到。','外包窗口說正常，沒有帶證據。',[good('要求原因與影響範圍','形容詞開始換成資料。'),fast('轉寄正常兩字','答案現在有了你的名字。')])
  ];
  const night=[
    e('night1','home','SQE','人回家了，SQE 沒有。','供應商傳了一張沒有序號的照片：「這樣可以嗎？」餐桌現在是一個遠端檢驗站。',[o('限定回覆範圍，要求資料並交接','你沒有憑照片替整批放行。',{quality:5,stress:4,credit:4,overtime:70}),o('幫對方把 CAR 也寫完','外包的是加工，內包的是焦慮。',{stress:15,overtime:100},{flag:'unlimited'})]),
    e('night2','home','CQE','八種職能，只有一個充電器。','群組要完整報告，現場資料還沒完整。人沒有跟筆電一樣的充電孔。',[o('列出證據與待驗證事項','未知被寫清楚，不被寫成結論。',{quality:6,stress:5,credit:5,overtime:80}),o('把漂亮的完整原因報告先寄出','簡報完整，根因還在現場。',{quality:-10,stress:15,credit:-7,overtime:120},{flag:'unlimited'})]),
    e('night3','home','QE','明天的你，已經被今天的你排滿了。','23:58，系統問是否儲存變更。你想把自己存回變更前。',[o('完成原案與夜間交接，關機','工作交出去了，今天終於可以結束。',{stress:-8,credit:5,overtime:20},{finish:true,flag:'originalHanded'}),o('再多寫一份待辦才睡','第一條待辦是「請記得休息」。',{stress:9,overtime:45},{finish:true})])
  ];
  root.QE3Data={roles,stations,routes,quests,random,night};
  if(typeof module!=='undefined') module.exports=root.QE3Data;
})(typeof window!=='undefined'?window:globalThis);
