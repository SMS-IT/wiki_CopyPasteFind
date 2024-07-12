/*
алгоритм:

проходим по всему тексту

для каждого слова ищем основу - используем стеммер Портера
 - добавляем слово в словарь (СлСлов)
   ключ - слово, значение - основа (чтоб потом быстро искать основу по слову)
 - если это предлог то заменям его на какой то спец слово типа _ПРЕДЛОГ_

ведем отдельный словарь основ (СлОсн)
 - ключ = основа, значение = колво повторов

После окончания прохода по тексту
- чистим словарь основ от всех слов с колвом = 1

Бьем текст на предложения

Для каждого предлоджения
- запускаем перебор цепочек длиной от 2 до Н  (для 1 слова у нас уже есть статистика)
- по цепочке формируем цепочку основ (используя словарь слово--основа)
- добавляем цепочку в словарь (СлЦеп)
  ключ = цепочка основ
  значение = тупле( колво слов в цепочке, [массив из исходных цепочек] )

После прохода по всем предложениям
- сортируем СлЦеп по
  - колвл слов в цепочке
  - колво вхождений

Запускаем раскраску
- идем по отсортированному СлЦеп
- для каждой длины цепочки (в словах) имеем массив (конст) сколько Топ Н штук цепочек такой длины подвечивать (длинных поменьше, коротких побольше)
  и начиная от какого кол-ва подсвечивать (одиночные слова надо прям очень частые, а длинные цепочки можно и от 5)
- берем из словаря СлЦеп все оригинальные цепочки, и подсвечиваем их в HTML

*/


// обработчик для встраивания в страницу
(function ($, mw) {

    // обработчик нажатия иконки в меню
    function onMenuClick() {
        console.log("[copypaste] Начинаем процесс замены копипаста ...");

        // заменяем копипасты
        openModalCopyPasteFind();
    }


    $(function () {
        // добавляем кнопку в тулбар
        var menuElement = document.createElement("li");
        menuElement.innerHTML = '<span><a id="OpenCopyPasteFindPanel" href="#" title="Поиск копипаста"><img style="width: 26px;margin-top:-10px;"  src="/skins/common/images/copypastefind.svg"</a></span>';
        var elementBefore = document.getElementById("ca-watch");
        if (elementBefore) {
            elementBefore.parentElement.insertBefore(menuElement, elementBefore);
        } else {
            elementBefore = document.getElementById("ca-unwatch");
            if (elementBefore) {
                elementBefore.parentElement.insertBefore(menuElement, elementBefore);
            }
        }

        // Attach click handler for button
        $('#OpenCopyPasteFindPanel').click(onMenuClick);
    });


    //------------

    /* Porter stemmer in Javascript for Russian. Programmer: http://gsgen.ru/ */
    var PorterStemRu = function () {
        var Stem_Cache = {};
        var PERFECTIVEGROUND = '((ив|ивши|ившись|ыв|ывши|ывшись)|(([ая])(в|вши|вшись)))$';
        var REFLEXIVE = '(с[яь])$';
        var ADJECTIVE = '(ее|ие|ые|ое|ими|ыми|ей|ий|ый|ой|ем|им|ым|ом|его|ого|еых|ему|ому|их|ых|ую|юю|ая|яя|ою|ею)$';
        var PARTICIPLE = '((ивш|ывш|ующ)|(([ая])(ем|нн|вш|ющ|щ)))$';
        var VERB = '((ила|ыла|ена|ейте|уйте|ите|или|ыли|ей|уй|ил|ыл|ел|ела|ели|им|ым|ен|ило|ыло|ено|ят|ует|уют|ит|ыт|ены|ить|ыть|ишь|ую|ю)|(([ая])(ла|на|ете|йте|ли|й|л|ем|н|ло|но|ет|ют|ны|ть|ешь|нно)))$';
        var NOUN = '(а|ев|ов|ие|ье|е|иями|ями|ами|еи|ии|и|ией|ей|ой|ий|й|иям|ям|ием|ем|ам|ом|о|у|ах|иях|ях|ы|ь|ию|ью|ю|ия|ья|я)$';
        var RVRE = '^(.*?[аеиоуыэюя])(.*)$';
        var DERIVATIONAL = '.*[^аеиоуыэюя]+[аеиоуыэюя].*(о)сть?$';
        var DER = 'ость?$';
        var SUPERLATIVE = '(ейше|ейш)$';
        var I = 'и$';
        var P = 'ь$';
        var NN = 'нн$';

        var RV = '';
        var this_obj = this;
        this_obj.Stem_Caching = 0;

        function smarty_replace(str, regexp_str, to) {
            var orig = str;
            var test_match_arr;
            var regexp = new RegExp(regexp_str, '');
            var test_regexp_str = '([ая])(в|вши|вшись|ем|нн|вш|ющ|щ|ла|на|ете|йте|ли|й|л|н|ло|но|ет|ют|ны|ть|ешь|нно)$';
            test_regexp = new RegExp(test_regexp_str, '');
            if (str) {
                str = str.replace(regexp, function (str_match) {
                    test_match_arr = test_regexp.exec(orig);
                    if (test_match_arr != null && str_match == test_match_arr[0]) {
                        // Имитация незапоминающих скобок
                        to += test_match_arr[1];
                    }
                    return to;
                });
            }
            RV = str;
            return orig !== str;
        }

        function m_test(str, regexp_str) {
            var regexp = new RegExp(regexp_str, '');
            return regexp.test(str);
        }

        this_obj.stem_word = function (word) {
            word = word.toLowerCase();
            word = word.replace('ё', 'е');	// замена ё на е, чтобы учитывалась как одна и та же буква
            /* # Check cache of stemmed words */
            if (this_obj.Stem_Caching && Stem_Cache[word]) {
                return Stem_Cache[word];
            }
            var stem = word;
            var start = '';
            RV = '';
            var regexp;
            var parser_result = [];
            var i = 0;
            do {
                regexp = new RegExp(RVRE, '');
                parser_result = [];
                parser_result = stem.match(regexp);
                if (parser_result == null) {
                    break;
                }
                start = parser_result[1];
                RV = parser_result[2];
                if (!RV) {
                    break;
                }
                /* # Step 1 */
                if (!smarty_replace(RV, PERFECTIVEGROUND, '')) {
                    smarty_replace(RV, REFLEXIVE, '');
                    if (smarty_replace(RV, ADJECTIVE, '')) {
                        smarty_replace(RV, PARTICIPLE, '');
                    } else {
                        if (!smarty_replace(RV, VERB, ''))
                            smarty_replace(RV, NOUN, '');
                    }
                }
                /* # Step 2 */
                smarty_replace(RV, I, '');
                /* # Step 3 */
                if (m_test(RV, DERIVATIONAL)) {
                    smarty_replace(RV, DER, '');
                }
                /* # Step 4 */
                if (!smarty_replace(RV, P, '')) {
                    smarty_replace(RV, SUPERLATIVE, '');
                    smarty_replace(RV, NN, 'н');
                }
                stem = start + RV;
            } while (false);
            if (this_obj.Stem_Caching) {
                Stem_Cache[word] = stem;
            }
            return stem;
        }

        this_obj.clear_stem_cache = function () {
            Stem_Cache = [];
        }

        /* Sample of using Porter stemmer in Javascript */
        /*
        var stemmer = new PorterStemRu();
        stemmer.Stem_Caching = 1; // 0|1 вкл/выкл кэш
        console.log(stemmer.stem_word('Профпригодность'));
        console.log(stemmer.stem_word('Просматривала'));
        stemmer.clear_stem_cache(); // Чистим кэш
        */

    } // end class PorterStemRu

    ///----------


    // формирует словарь -- ключ = слово, значение = основа
    function generateWordStemDict(text_str) {
        console.log("[copypaste] Формируем словарь основ ...");
        var _min_word_len = 3;

        var regexp_str = '([\\.,!\\?:;]*\\s+)|([\\.,!\\?:;]+$)';
        var regexp = new RegExp(regexp_str, 'gm');
        text_str = text_str.replace(regexp, ' ');
        text_str = text_str.replace(new RegExp('^\\s+|\\s+$', 'g'), '');
        var words_list = text_str.split(' ');
        var stemmer = new PorterStemRu();
        stemmer.Stem_Caching = 1; // 0|1 вкл/выкл кэш
        var word_stemms = {};

        words_list.map((word) => {
            var word_stem = stemmer.stem_word(word);

            // если основа длинная - добавляем в словарь
            // если основа короткая то закидываем все под одну запись
            if (word_stem.length < _min_word_len) {
                word_stem = "_ANY_";
            }

            if (!word_stemms[word])
                word_stemms[word] = {'count': 0, 'stem': word_stem};
            else
                word_stemms[word].count++;
        });
        stemmer.clear_stem_cache(); // Чистим кэш

        return word_stemms;
    }


    //---------------------

    // ищет вхождения повторов в теле страницы
    // возвращает  html страницы с подсвеченными повторами
    function findCopyPaste(text, html, selectedLength) {
        console.log("[copypaste] findCopyPaste ...");

        var _min_matches_count = 5; // минимальное кол-во повторов начиная с которого предупреждаем
        var _max_chain_len = 10; // макс длина цепочки

        // убираем пробелы с концов текста
        text = text.replace(new RegExp('^\\s+|\\s+$', 'g'), '');
        text = text.toLowerCase();

        // формируем словарь слово-основа
        var word2stemms = generateWordStemDict(text);

        // найденные комбинации. ключ - строка, значение - длина
        let allCombs = {};

        //- разбиваем текст на предложения
        //- внутри предложений убираем все знаки препинания и спецсимволы
        console.log("[copypaste] бьем на предложения ...");
        let sentence;
        let regSentence = new RegExp(/[^\s.!?:;,]+[^.!?:;,\r\n]+[.!?:;,]*/, 'g');
        // бьем на предложения
        let r1 = new RegExp(/[.!?:;,\d+\r\n]/, 'g');
        while ((sentence = regSentence.exec(text)) != null) {
            // убираем знаки
            let buf = sentence[0].replace(r1, '').trim();
            // если в предложении есть русские буквы и более 2 слов - берем в обработку
            if (!(/[а-яА-ЯЁё]/.test(buf) && buf.split(' ').length > 2))
                continue;

            sent = buf;
            // бьем предложение на слова
            let wordsInSent = sent.trim().split(' ');
            wordsInSent = wordsInSent.filter((part) => part.length > 0);

            // заменяем слова в предл на основы
            stemsInSent = wordsInSent.map((word) => {
                let s = word2stemms[word];
                return (s) ? s.stem : "xxxxx";
            });

            // внутри предложения перебираем словосочетания длиной от 2 до 4
            for (let combLen = 2; combLen <= _max_chain_len; combLen++) {
                if (wordsInSent.length < combLen) continue;

                // получаем массив цепочек нужной длины из предложения
                // каждая цепочка идет в 2 видах - цепочка из основ и оригинальная
                // цепочка из основ нужна для счетчика повторений
                let combs = [];
                for (let k = 0; k <= wordsInSent.length - combLen; k++) {
                    combs.push([
                        wordsInSent.slice(k, k + combLen),
                        stemsInSent.slice(k, k + combLen)
                    ]);
                }

                for (let comb of combs) {
                    let combWords = comb[0];
                    let combStems = comb[1];

                    let joinedStems = combStems.join(' ').trim().replaceAll(/[|\\{()[^$+*?.-]/g, "\\$&"); // не понял что это ???

                    if (/[а-яА-ЯЁё]/.test(joinedStems)) {

                        /*
                        // ищем сколько раз словосочетание встретилось во всем тексте
                        */
                        joinedStems = joinedStems.replaceAll(' ', "\\s");
                        joinedWords = combWords.join(' ');
                        if (!allCombs[joinedStems]) {
                            allCombs[joinedStems] = {'count': 1, 'words': combLen, 'sents': {}};
                            allCombs[joinedStems]['sents'][joinedWords] = 1;
                        } else {
                            allCombs[joinedStems]['count']++;
                            if (!allCombs[joinedStems]['sents'][joinedWords])
                                allCombs[joinedStems]['sents'][joinedWords] = 1;
                            else
                                allCombs[joinedStems]['sents'][joinedWords]++;
                        }
                    }

                }
            }

        } // цикл по предл

        console.log("[copypaste] делаем подсветку на странице ...");

        //!!! подумать как не заменять в комментариях и хинтах и тексте ссылок а то едет разметка

        // сотрируем все найденные комбинации по длине цепочки и кол-ву вхождений
        let allCombsKVals = Object.values(allCombs).sort((a, b) =>
            (b['words'] != a['words']) ?
                (b['words'] - a['words']) :
                (b['count'] - a['count'])
        );

        // выводим комбинации
        let combIndex = 0;
        for (let val of allCombsKVals) {
            const comb = val;

            if (comb.count <= _min_matches_count) continue;

            // отбрасываем короткие словосочетания - по на, и в, ... и предлоги в начале словосочетаний
            for (let sent of Object.keys(comb.sents).sort((a, b) => b.length - a.length)) {
                let splitted = sent.split(' ');
                let length = 0;
                for (let part of splitted)
                    length += part.length;

                if ((length > splitted.length) && (length > 4) && selectedLength.includes(splitted.length)
                    && ((splitted[0].length > 2) || (splitted.length > 2)) // цепочка из 2 слов и начинается с предлога
                    && ((splitted[splitted.length - 1].length > 2) || (splitted.length > 2)) // цепочка из 2 слов и кончается предлогом
                ) {
                    try {
                        let sent = splitted.join(' ').replace(/[|\\{()[^$+*?.-]/g, "\\$&").replaceAll(' ', '\\s+');
                        console.log("[copypaste] ", comb.count, sent)
                        let r2 = new RegExp(sent, 'ig');
                        html = html.replace(r2, w => {
                            return `<span class='copypastesel' comb="comb${combIndex}" title='повторов: ( ${comb.count} )'>` + w + '</span>';
                        });
                    } catch (err) {
                    }
                } else {
                    console.log("[x] ", comb);
                }
            }
            combIndex++;
        }
        console.log("[copypaste] финиш ...");

        return {
            'html': html,
        };
    }

    // запускает поиск коппаст в теле страницы и заменяет тело страницы на сгенерированный html с подсветкой повторов
    function ProcessCopyPaste(selectedLength) {
        // получаем текст со страницы
        var text = $('.mw-parser-output').text();
        var html = HTML_SAVED;

        // хаки для вики
        text = text.replaceAll("[править | править код]", "");
        text = text.replaceAll("[ Figma ]", "");
        text = text.replaceAll("[ .svg ]", "");
        text = text.replaceAll("[ UPDATE ]", "");

        html = html.replaceAll(new RegExp('title=\"[^\"]+\"', 'ig'), "");

        var res = findCopyPaste(text, html, selectedLength);
        $('.mw-parser-output').html(res['html'])
    }

    function openModalCopyPasteFind() {
        closeCopyPasteModal = function () {
            $('#copyPasteFindModal')[0].style["display"] = "none";
        }

        acceptSelectedLength = function () {
            var selectedLength = [];
            $('#copyPasteFindModal  input[type=checkbox]:checked').each(function () {
                selectedLength.push(parseInt($(this)[0].parentElement.children[1].innerText));
            });
            ProcessCopyPaste(selectedLength);
            closeCopyPasteModal();

            showSelectedCombOnly = function (e) {
                let selectedComb = e.target.getAttribute('comb');
                $('span.copypastesel').filter(function () {
                    return $(this)[0].getAttribute('comb') != selectedComb;
                }).each(function () {
                    $(this)[0].className = '';
                })
            }
            $('span.copypastesel').each(function () {
                $(this)[0].addEventListener('click', function (e) {
                    showSelectedCombOnly(e);
                })
            });
        }

        selectAll = function () {
            $('#copyPasteFindModal  input[type=checkbox]').each(function () {
                $(this)[0].checked = true;
            });
        }

        diselectAll = function () {
            $('#copyPasteFindModal  input[type=checkbox]').each(function () {
                $(this)[0].checked = false;
            });
        }

        if (!document.getElementById("copyPasteFindModal")) {
            var modalDiv = document.createElement("div");

            modalDiv.setAttribute("id", "copyPasteFindModal");
            modalDiv.setAttribute("style", " position: fixed; z-index: 1; left: 0; top: 0; width: 100%; height: 100%; overflow: auto; background-color: rgb(0,0,0); background-color: rgba(0,0,0,0.4);");
            var inner = "<div style='background-color: #fefefe; margin: 15% auto; padding: 20px; border: 10px solid #2781c5; width: fit-content;'>";
            inner += "<div><div><button style='padding: 2px 15px;' onclick='selectAll()' >Выбрать все</button>";
            inner += "<button style='padding: 2px 15px;' onclick='diselectAll()' >Снять все</button></div><hr style='margin: 15px 0px;'>";
            for (let i = 2; i <= 10; i++) {
                inner += `<div><input id='copyPasteLength${i}' type='checkbox' name='copyPasteLength${i}'/><label for='copyPasteLength${i}'>${i}</label></div>`;
            }
            inner += "</div><hr style='margin: 15px 0px;'>";
            inner += "<div style='display: flex; justify-content: space-between;'><button style='padding: 2px 15px;' onclick='acceptSelectedLength()' >Принять</button>";
            inner += "<button style='padding: 2px 15px;' onclick='closeCopyPasteModal()' >Отмена</button></div></div>";
            modalDiv.innerHTML = inner;
            var lastChild = document.body.lastChild;
            document.body.insertBefore(modalDiv, lastChild.nextSibling);
        } else {
            $('#copyPasteFindModal')[0].style["display"] = "";
        }
    }


}(jQuery, mediaWiki));
