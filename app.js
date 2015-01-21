/// imports
port_number =process.argv[process.argv.length-1]
console.log('using port number', port_number)

var fs = require('fs'),
    http = require('http'),
    path = require('path'),
    _ = require('underscore'),
    sio = require('socket.io'),
express = require('express');
//    wikichanges = require('wikichanges');

// get the configuration

var configPath = path.join(__dirname, "config.json");
var config = JSON.parse(fs.readFileSync(configPath));
var app = module.exports = express.createServer();
var requestCount = 0;

// get the wikipedia shortnames sorted by their longname

var wikisSorted = ['#ar.wikipedia', '#bg.wikipedia', '#ca.wikipedia', '#zh.wikipedia', '#cs.wikipedia', '#da.wikipedia', '#nl.wikipedia', '#en.wikipedia', '#eo.wikipedia', '#eu.wikipedia', '#fa.wikipedia', '#fi.wikipedia', '#fr.wikipedia', '#de.wikipedia', '#el.wikipedia', '#he.wikipedia', '#hu.wikipedia', '#id.wikipedia', '#it.wikipedia', '#ja.wikipedia', '#ko.wikipedia', '#lt.wikipedia', '#ms.wikipedia', '#no.wikipedia', '#pl.wikipedia', '#pt.wikipedia', '#ro.wikipedia', '#ru.wikipedia', '#sk.wikipedia', '#sl.wikipedia', '#es.wikipedia', '#sv.wikipedia', '#tr.wikipedia', '#uk.wikipedia', '#vi.wikipedia', '#vo.wikipedia', '#wikidata.wikipedia', '#commons.wikimedia' ];
// set up the web app

app.configure(function () {
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(redirectOldPort);
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
});

app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
  app.use(express.static(__dirname + '/public'));
});

app.configure('production', function () {
  app.use(express.errorHandler()); 
  app.use(express.static(__dirname + '/public', {maxAge: 60*15*1000}));
});

wikisobj = { '#vo.wikipedia': 
   { short: 'vo',
     long: 'Volapük Wikipedia',
     namespaces: 
      { Patikos: 'special',
        'Nünamakanäd': 'media',
        'Bespik dö sitanuns': 'mediawiki talk',
        Ragivibespik: 'file talk',
        Kladibespik: 'category talk',
        Geban: 'user',
        Klad: 'category',
        Bespik: 'talk',
        Yufibespik: 'help talk',
        Gebanibespik: 'user talk',
        Sitanuns: 'mediawiki',
        Samafomotibespik: 'template talk',
        Samafomot: 'template',
        'Bespik dö $1': 'project talk',
        Ragiv: 'file',
        Yuf: 'help' } },
  '#lt.wikipedia': 
   { short: 'lt',
     long: 'Lithuanian Wikipedia',
     namespaces: 
      { MediaWiki: 'mediawiki',
        Aptarimas: 'talk',
        Pagalba: 'help',
        'Šablonas': 'template',
        Medija: 'media',
        Naudotojas: 'user',
        'Vaizdo aptarimas': 'file talk',
        'Naudotojo aptarimas': 'user talk',
        Vaizdas: 'file',
        Specialus: 'special',
        'MediaWiki aptarimas': 'mediawiki talk',
        Kategorija: 'category',
        '$1 aptarimas': 'project talk',
        'Šablono aptarimas': 'template talk',
        'Pagalbos aptarimas': 'help talk',
        'Kategorijos aptarimas': 'category talk' } },
  '#id.wikipedia': 
   { short: 'id',
     long: 'Indonesian Wikipedia',
     namespaces: 
      { 'Pembicaraan MediaWiki': 'mediawiki talk',
        Media: 'media',
        'Pembicaraan Templat': 'template talk',
        MediaWiki: 'mediawiki',
        Kategori: 'category',
        Pembicaraan: 'talk',
        Istimewa: 'special',
        'Pembicaraan Pengguna': 'user talk',
        'Pembicaraan Berkas': 'file talk',
        'Pembicaraan Kategori': 'category talk',
        Berkas: 'file',
        'Pembicaraan $1': 'project talk',
        Bantuan: 'help',
        'Pembicaraan Bantuan': 'help talk',
        Templat: 'template',
        Pengguna: 'user' } },
  '#de.wikipedia': 
   { short: 'de',
     long: 'German Wikipedia',
     namespaces: 
      { Medium: 'media',
        'MediaWiki Diskussion': 'mediawiki talk',
        Spezial: 'special',
        Hilfe: 'help',
        'Benutzer Diskussion': 'user talk',
        'Vorlage Diskussion': 'template talk',
        Vorlage: 'template',
        MediaWiki: 'mediawiki',
        Diskussion: 'talk',
        'Datei Diskussion': 'file talk',
        'Kategorie Diskussion': 'category talk',
        Datei: 'file',
        'Hilfe Diskussion': 'help talk',
        Kategorie: 'category',
        '$1 Diskussion': 'project talk',
        Benutzer: 'user' } },
  '#uk.wikipedia': 
   { short: 'uk',
     long: 'Ukrainian Wikipedia',
     namespaces: 
      { 'Обговорення шаблону': 'template talk',
        MediaWiki: 'mediawiki',
        'Категорія': 'category',
        'Медіа': 'media',
        'Обговорення файлу': 'file talk',
        'Обговорення {{GRAMMAR:genitive|$1}}': 'project talk',
        'Довідка': 'help',
        'Шаблон': 'template',
        'Обговорення довідки': 'help talk',
        'Обговорення категорії': 'category talk',
        'Користувач': 'user',
        'Обговорення MediaWiki': 'mediawiki talk',
        'Обговорення': 'talk',
        'Файл': 'file',
        'Обговорення користувача': 'user talk',
        'Спеціальна': 'special' } },
  '#el.wikipedia': 
   { short: 'el',
     long: 'Greek Wikipedia',
     namespaces: 
      { 'Μέσο': 'media',
        MediaWiki: 'mediawiki',
        'Χρήστης': 'user',
        'Ειδικό': 'special',
        '$1 συζήτηση': 'project talk',
        'Κατηγορία': 'category',
        'Πρότυπο': 'template',
        'Συζήτηση αρχείου': 'file talk',
        'Συζήτηση προτύπου': 'template talk',
        'Αρχείο': 'file',
        'Συζήτηση χρήστη': 'user talk',
        'Βοήθεια': 'help',
        'Συζήτηση βοήθειας': 'help talk',
        'Συζήτηση': 'talk',
        'Συζήτηση MediaWiki': 'mediawiki talk',
        'Συζήτηση κατηγορίας': 'category talk' } },
  '#eo.wikipedia': 
   { short: 'eo',
     long: 'Esperanto Wikipedia',
     namespaces: 
      { Speciala: 'special',
        MediaVikio: 'mediawiki',
        Diskuto: 'talk',
        Uzulo: 'user',
        'Uzula diskuto': 'user talk',
        Dosiero: 'file',
        'Dosiera diskuto': 'file talk',
        '$1 diskuto': 'project talk',
        'Aŭdvidaĵo': 'media',
        'Ŝablono': 'template',
        'Ŝablona diskuto': 'template talk',
        Kategorio: 'category',
        Helpo: 'help',
        'MediaVikia diskuto': 'mediawiki talk',
        'Kategoria diskuto': 'category talk',
        'Helpa diskuto': 'help talk' } },
  '#ar.wikipedia': 
   { short: 'ar',
     long: 'Arabic Wikipedia',
     namespaces: 
      { 'نقاش ميدياويكي': 'mediawiki talk',
        'نقاش القالب': 'template talk',
        'قالب': 'template',
        'نقاش الملف': 'file talk',
        'مساعدة': 'help',
        'نقاش المستخدم': 'user talk',
        'نقاش': 'talk',
        'تصنيف': 'category',
        'نقاش المساعدة': 'help talk',
        'نقاش $1': 'project talk',
        'مستخدم': 'user',
        'ميديا': 'media',
        'ميدياويكي': 'mediawiki',
        'ملف': 'file',
        'خاص': 'special',
        'نقاش التصنيف': 'category talk' } },
  '#tr.wikipedia': 
   { short: 'tr',
     long: 'Turkish Wikipedia',
     namespaces: 
      { 'Kullanıcı mesaj': 'user talk',
        'Özel': 'special',
        MediaWiki: 'mediawiki',
        '$1 tartışma': 'project talk',
        Kategori: 'category',
        Dosya: 'file',
        'Dosya tartışma': 'file talk',
        'Şablon tartışma': 'template talk',
        'Şablon': 'template',
        'Tartışma': 'talk',
        'Yardım tartışma': 'help talk',
        'MediaWiki tartışma': 'mediawiki talk',
        'Kategori tartışma': 'category talk',
        'Kullanıcı': 'user',
        'Yardım': 'help',
        Medya: 'media' } },
  '#he.wikipedia': 
   { short: 'he',
     long: 'Hebrew Wikipedia',
     namespaces: 
      { '': 'main',
        'שיחת קטגוריה': 'category talk',
        'שיחת עזרה': 'help talk',
        'שיחה': 'talk',
        'מדיה ויקי': 'mediawiki',
        'שיחת תבנית': 'template talk',
        'שיחת משתמש': 'user talk',
        'קטגוריה': 'category',
        'שיחת קובץ': 'file talk',
        'קובץ': 'file',
        'שיחת מדיה ויקי': 'mediawiki talk',
        'תבנית': 'template',
        'מדיה': 'media',
        'שיחת $1': 'project talk',
        'עזרה': 'help',
        'משתמש': 'user',
        'מיוחד': 'special' } },
  '#ru.wikipedia': 
   { short: 'ru',
     long: 'Russian Wikipedia',
     namespaces: 
      { 'Медиа': 'media',
        'Обсуждение {{GRAMMAR:genitive|$1}}': 'project talk',
        'Категория': 'category',
        'Обсуждение файла': 'file talk',
        MediaWiki: 'mediawiki',
        'Обсуждение справки': 'help talk',
        'Обсуждение шаблона': 'template talk',
        'Обсуждение': 'talk',
        'Обсуждение участника': 'user talk',
        'Служебная': 'special',
        'Шаблон': 'template',
        'Справка': 'help',
        'Участник': 'user',
        'Обсуждение категории': 'category talk',
        'Обсуждение MediaWiki': 'mediawiki talk',
        'Файл': 'file' } },
  '#fi.wikipedia': 
   { short: 'fi',
     long: 'Finnish Wikipedia',
     namespaces: 
      { 'Keskustelu käyttäjästä': 'user talk',
        Media: 'media',
        Ohje: 'help',
        'Keskustelu ohjeesta': 'help talk',
        'Järjestelmäviesti': 'mediawiki',
        'Keskustelu luokasta': 'category talk',
        'Keskustelu mallineesta': 'template talk',
        Luokka: 'category',
        Toiminnot: 'special',
        'Keskustelu {{GRAMMAR:elative|$1}}': 'project talk',
        Tiedosto: 'file',
        'Käyttäjä': 'user',
        'Keskustelu järjestelmäviestistä': 'mediawiki talk',
        Keskustelu: 'talk',
        'Keskustelu tiedostosta': 'file talk',
        Malline: 'template' } },
  '#eu.wikipedia': 
   { short: 'eu',
     long: 'Euskara Wikipedia',
     namespaces: 
      { Lankide: 'user',
        Media: 'media',
        Laguntza: 'help',
        MediaWiki: 'mediawiki',
        Eztabaida: 'talk',
        'Txantiloi eztabaida': 'template talk',
        'Fitxategi eztabaida': 'file talk',
        'Lankide eztabaida': 'user talk',
        '$1 eztabaida': 'project talk',
        'Kategoria eztabaida': 'category talk',
        Txantiloi: 'template',
        Kategoria: 'category',
        Berezi: 'special',
        Fitxategi: 'file',
        'MediaWiki eztabaida': 'mediawiki talk',
        'Laguntza eztabaida': 'help talk' } },
  '#sl.wikipedia': 
   { short: 'sl',
     long: 'Slovene Wikipedia',
     namespaces: 
      { MediaWiki: 'mediawiki',
        Slika: 'file',
        Datoteka: 'media',
        'Pogovor o kategoriji': 'category talk',
        'Pogovor o sliki': 'file talk',
        Posebno: 'special',
        'Uporabniški pogovor': 'user talk',
        'Pogovor o predlogi': 'template talk',
        Predloga: 'template',
        'Pogovor o MediaWiki': 'mediawiki talk',
        Pogovor: 'talk',
        Kategorija: 'category',
        Uporabnik: 'user',
        'Pogovor {{grammar:mestnik|$1}}': 'project talk',
        'Pomoč': 'help',
        'Pogovor o pomoči': 'help talk' } },
  '#nl.wikipedia': 
   { short: 'nl',
     long: 'Dutch Wikipedia',
     namespaces: 
      { Media: 'media',
        'Overleg categorie': 'category talk',
        MediaWiki: 'mediawiki',
        'Overleg $1': 'project talk',
        'Overleg help': 'help talk',
        'Overleg bestand': 'file talk',
        'Overleg sjabloon': 'template talk',
        Categorie: 'category',
        Bestand: 'file',
        'Overleg MediaWiki': 'mediawiki talk',
        Speciaal: 'special',
        Sjabloon: 'template',
        Help: 'help',
        Overleg: 'talk',
        'Overleg gebruiker': 'user talk',
        Gebruiker: 'user' } },
  '#pl.wikipedia': 
   { short: 'pl',
     long: 'Polish Wikipedia',
     namespaces: 
      { 'Dyskusja kategorii': 'category talk',
        'Dyskusja $1': 'project talk',
        MediaWiki: 'mediawiki',
        Kategoria: 'category',
        Media: 'media',
        'Dyskusja szablonu': 'template talk',
        Szablon: 'template',
        Plik: 'file',
        'Dyskusja pliku': 'file talk',
        Dyskusja: 'talk',
        'Użytkownik': 'user',
        'Dyskusja użytkownika': 'user talk',
        Specjalna: 'special',
        Pomoc: 'help',
        'Dyskusja pomocy': 'help talk',
        'Dyskusja MediaWiki': 'mediawiki talk' } },
  '#sv.wikipedia': 
   { short: 'sv',
     long: 'Swedish Wikipedia',
     namespaces: 
      { 'Användare': 'user',
        Kategori: 'category',
        MediaWiki: 'mediawiki',
        Malldiskussion: 'template talk',
        Media: 'media',
        Fildiskussion: 'file talk',
        '$1diskussion': 'project talk',
        'MediaWiki-diskussion': 'mediawiki talk',
        'Hjälpdiskussion': 'help talk',
        'Användardiskussion': 'user talk',
        Fil: 'file',
        Mall: 'template',
        Kategoridiskussion: 'category talk',
        'Hjälp': 'help',
        Special: 'special',
        Diskussion: 'talk' } },
  '#cs.wikipedia': 
   { short: 'cs',
     long: 'Czech Wikipedia',
     namespaces: 
      { 'Diskuse k nápovědě': 'help talk',
        'Uživatel': 'user',
        MediaWiki: 'mediawiki',
        'Diskuse k šabloně': 'template talk',
        Soubor: 'file',
        Diskuse: 'talk',
        'Diskuse k souboru': 'file talk',
        'Diskuse k MediaWiki': 'mediawiki talk',
        'Diskuse ke kategorii': 'category talk',
        'Diskuse k {{grammar:3sg|$1}}': 'project talk',
        'Nápověda': 'help',
        Kategorie: 'category',
        'Šablona': 'template',
        'Speciální': 'special',
        'Média': 'media',
        'Diskuse s uživatelem': 'user talk' } },
  '#pt.wikipedia': 
   { short: 'pt',
     long: 'Portuguese Wikipedia',
     namespaces: 
      { Categoria: 'category',
        'Discussão': 'talk',
        Especial: 'special',
        'Predefinição': 'template',
        'Predefinição Discussão': 'template talk',
        Ficheiro: 'file',
        Ajuda: 'help',
        'Utilizador Discussão': 'user talk',
        'Ajuda Discussão': 'help talk',
        MediaWiki: 'mediawiki',
        'MediaWiki Discussão': 'mediawiki talk',
        'Ficheiro Discussão': 'file talk',
        Utilizador: 'user',
        '$1 Discussão': 'project talk',
        'Categoria Discussão': 'category talk',
        'Multimédia': 'media' } },
  '#ro.wikipedia': 
   { short: 'ro',
     long: 'Romanian Wikipedia',
     namespaces: 
      { Ajutor: 'help',
        Categorie: 'category',
        'Discuție Categorie': 'category talk',
        Utilizator: 'user',
        Media: 'media',
        Format: 'template',
        'Discuție Utilizator': 'user talk',
        MediaWiki: 'mediawiki',
        'Discuție Fișier': 'file talk',
        'Discuție': 'talk',
        'Fișier': 'file',
        'Discuție Ajutor': 'help talk',
        'Discuție $1': 'project talk',
        'Discuție MediaWiki': 'mediawiki talk',
        'Discuție Format': 'template talk',
        Special: 'special' } },
  '#it.wikipedia': 
   { short: 'it',
     long: 'Italian Wikipedia',
     namespaces: 
      { Media: 'media',
        MediaWiki: 'mediawiki',
        Template: 'template',
        Categoria: 'category',
        'Discussioni file': 'file talk',
        'Discussioni aiuto': 'help talk',
        'Discussioni categoria': 'category talk',
        'Discussioni template': 'template talk',
        'Discussioni $1': 'project talk',
        Speciale: 'special',
        Utente: 'user',
        'Discussioni utente': 'user talk',
        'Discussioni MediaWiki': 'mediawiki talk',
        Discussione: 'talk',
        File: 'file',
        Aiuto: 'help' } },
  '#sk.wikipedia': 
   { short: 'sk',
     long: 'Slovak Wikipedia',
     namespaces: 
      { 'Diskusia k pomoci': 'help talk',
        MediaWiki: 'mediawiki',
        Pomoc: 'help',
        Redaktor: 'user',
        'Diskusia k súboru': 'file talk',
        'Diskusia ku kategórii': 'category talk',
        'Diskusia s redaktorom': 'user talk',
        'Diskusia k {{GRAMMAR:datív|$1}}': 'project talk',
        'Diskusia k šablóne': 'template talk',
        'Súbor': 'file',
        'Špeciálne': 'special',
        'Kategória': 'category',
        Diskusia: 'talk',
        'Médiá': 'media',
        'Diskusia k MediaWiki': 'mediawiki talk',
        'Šablóna': 'template' } },
  '#ca.wikipedia': 
   { short: 'ca',
     long: 'Catalan Wikipedia',
     namespaces: 
      { Media: 'media',
        Ajuda: 'help',
        MediaWiki: 'mediawiki',
        'Usuari Discussió': 'user talk',
        'Plantilla Discussió': 'template talk',
        Categoria: 'category',
        Especial: 'special',
        Usuari: 'user',
        'MediaWiki Discussió': 'mediawiki talk',
        'Categoria Discussió': 'category talk',
        '$1 Discussió': 'project talk',
        Plantilla: 'template',
        'Fitxer Discussió': 'file talk',
        'Discussió': 'talk',
        'Ajuda Discussió': 'help talk',
        Fitxer: 'file' } },
  '#no.wikipedia': 
   { short: 'no',
     long: 'Norwegian Wikipedia',
     namespaces: 
      { Medium: 'media',
        Kategoridiskusjon: 'category talk',
        '$1-diskusjon': 'project talk',
        Brukerdiskusjon: 'user talk',
        Hjelp: 'help',
        Bruker: 'user',
        'MediaWiki-diskusjon': 'mediawiki talk',
        Diskusjon: 'talk',
        Spesial: 'special',
        MediaWiki: 'mediawiki',
        Hjelpdiskusjon: 'help talk',
        Kategori: 'category',
        Maldiskusjon: 'template talk',
        Fildiskusjon: 'file talk',
        Mal: 'template',
        Fil: 'file' } },
  '#es.wikipedia': 
   { short: 'es',
     long: 'Spanish Wikipedia',
     namespaces: 
      { Media: 'media',
        MediaWiki: 'mediawiki',
        'Plantilla Discusión': 'template talk',
        'Discusión': 'talk',
        Especial: 'special',
        'Usuario Discusión': 'user talk',
        '$1 Discusión': 'project talk',
        'Categoría Discusión': 'category talk',
        'Categoría': 'category',
        'Ayuda Discusión': 'help talk',
        Usuario: 'user',
        'MediaWiki Discusión': 'mediawiki talk',
        Plantilla: 'template',
        'Archivo Discusión': 'file talk',
        Archivo: 'file',
        Ayuda: 'help' } },
  '#ko.wikipedia': 
   { short: 'ko',
     long: 'Korean Wikipedia',
     namespaces: 
      { '$1토론': 'project talk',
        '토론': 'talk',
        '미디어': 'media',
        '틀': 'template',
        '사용자토론': 'user talk',
        '미디어위키': 'mediawiki',
        '미디어위키토론': 'mediawiki talk',
        '분류토론': 'category talk',
        '도움말토론': 'help talk',
        '틀토론': 'template talk',
        '사용자': 'user',
        '분류': 'category',
        '도움말': 'help',
        '파일': 'file',
        '파일토론': 'file talk',
        '특수기능': 'special' } },
  '#hu.wikipedia': 
   { short: 'hu',
     long: 'Hungarian Wikipedia',
     namespaces: 
      { '$1-vita': 'project talk',
        Sablonvita: 'template talk',
        'Speciális': 'special',
        'Fájl': 'file',
        'Segítségvita': 'help talk',
        'Kategória': 'category',
        'Média': 'media',
        'Fájlvita': 'file talk',
        MediaWiki: 'mediawiki',
        Sablon: 'template',
        'Segítség': 'help',
        'MediaWiki-vita': 'mediawiki talk',
        Vita: 'talk',
        'Szerkesztővita': 'user talk',
        'Kategóriavita': 'category talk',
        'Szerkesztő': 'user' } },
  '#fa.wikipedia': 
   { short: 'fa',
     long: 'Farsi Wikipedia',
     namespaces: 
      { '': 'main',
        'بحث رده': 'category talk',
        'بحث راهنما': 'help talk',
        'بحث': 'talk',
        'راهنما': 'help',
        'مدیا': 'media',
        'بحث الگو': 'template talk',
        'ویژه': 'special',
        'رده': 'category',
        'بحث کاربر': 'user talk',
        'کاربر': 'user',
        'پرونده': 'file',
        'بحث مدیاویکی': 'mediawiki talk',
        'بحث $1': 'project talk',
        'مدیاویکی': 'mediawiki',
        'بحث پرونده': 'file talk',
        'الگو': 'template' } },
  '#zh.wikipedia': 
   { short: 'zh',
     long: 'Chinese Wikipedia',
     namespaces: 
      { Category: 'category',
        Media: 'media',
        MediaWiki: 'mediawiki',
        Template: 'template',
        '$1 talk': 'project talk',
        'Help talk': 'help talk',
        User: 'user',
        'Template talk': 'template talk',
        'MediaWiki talk': 'mediawiki talk',
        Talk: 'talk',
        Help: 'help',
        'File talk': 'file talk',
        File: 'file',
        'User talk': 'user talk',
        Special: 'special',
        'Category talk': 'category talk' } },
  '#fr.wikipedia': 
   { short: 'fr',
     long: 'French Wikipedia',
     namespaces: 
      { Fichier: 'file',
        'Spécial': 'special',
        'Discussion aide': 'help talk',
        'Discussion modèle': 'template talk',
        Discussion: 'talk',
        'Modèle': 'template',
        'Discussion MediaWiki': 'mediawiki talk',
        Utilisateur: 'user',
        Aide: 'help',
        'Catégorie': 'category',
        MediaWiki: 'mediawiki',
        'Discussion $1': 'project talk',
        'Discussion utilisateur': 'user talk',
        'Discussion fichier': 'file talk',
        'Discussion catégorie': 'category talk',
        'Média': 'media' } },
  '#ja.wikipedia': 
   { short: 'ja',
     long: 'Japanese Wikipedia',
     namespaces: 
      { 'トーク': 'talk',
        '$1・トーク': 'project talk',
        'ファイル・トーク': 'file talk',
        '利用者・トーク': 'user talk',
        'テンプレート・トーク': 'template talk',
        'テンプレート': 'template',
        'カテゴリ・トーク': 'category talk',
        '特別': 'special',
        'カテゴリ': 'category',
        'MediaWiki・トーク': 'mediawiki talk',
        MediaWiki: 'mediawiki',
        'ファイル': 'file',
        'メディア': 'media',
        '利用者': 'user',
        'ヘルプ': 'help',
        'ヘルプ・トーク': 'help talk' } },
  '#bg.wikipedia': 
   { short: 'bg',
     long: 'Bulgarian Wikipedia',
     namespaces: 
      { 'Шаблон': 'template',
        'Специални': 'special',
        'Помощ беседа': 'help talk',
        '$1 беседа': 'project talk',
        'Беседа': 'talk',
        'Категория': 'category',
        'Категория беседа': 'category talk',
        'МедияУики': 'mediawiki',
        'Помощ': 'help',
        'Шаблон беседа': 'template talk',
        'Потребител': 'user',
        'Файл беседа': 'file talk',
        'Файл': 'file',
        'МедияУики беседа': 'mediawiki talk',
        'Потребител беседа': 'user talk',
        'Медия': 'media' } },
  '#ms.wikipedia': 
   { short: 'ms',
     long: 'Malaysian Wikipedia',
     namespaces: 
      { Perbincangan: 'talk',
        'Perbincangan Templat': 'template talk',
        'Perbincangan Kategori': 'category talk',
        MediaWiki: 'mediawiki',
        Media: 'media',
        'Perbincangan Pengguna': 'user talk',
        'Perbincangan Fail': 'file talk',
        Templat: 'template',
        Pengguna: 'user',
        Fail: 'file',
        'Perbincangan MediaWiki': 'mediawiki talk',
        Kategori: 'category',
        Khas: 'special',
        'Perbincangan $1': 'project talk',
        Bantuan: 'help',
        'Perbincangan Bantuan': 'help talk' } },
  '#en.wikipedia': 
   { short: 'en',
     long: 'English Wikipedia',
     namespaces: 
      { '': 'main',
        Category: 'category',
        Media: 'media',
        MediaWiki: 'mediawiki',
        Template: 'template',
        '$1 talk': 'project talk',
        'Help talk': 'help talk',
        User: 'user',
        'Template talk': 'template talk',
        'MediaWiki talk': 'mediawiki talk',
        Talk: 'talk',
        Help: 'help',
        'File talk': 'file talk',
        File: 'file',
        'User talk': 'user talk',
        Special: 'special',
        'Category talk': 'category talk' } },
  '#commons.wikimedia': 
   { short: 'co',
     long: 'Wikimedia Commons',
     namespaces: 
      { '': 'main',
        Category: 'category',
        Media: 'media',
        MediaWiki: 'mediawiki',
        Template: 'template',
        '$1 talk': 'project talk',
        'Help talk': 'help talk',
        User: 'user',
        'Template talk': 'template talk',
        'MediaWiki talk': 'mediawiki talk',
        Talk: 'talk',
        Help: 'help',
        'File talk': 'file talk',
        File: 'file',
        'User talk': 'user talk',
        Special: 'special',
        'Category talk': 'category talk' } },
  '#vi.wikipedia': 
   { short: 'vi',
     long: 'Vietnamese Wikipedia',
     namespaces: 
      { 'Thảo luận $1': 'project talk',
        'Trợ giúp': 'help',
        'Thể loại': 'category',
        MediaWiki: 'mediawiki',
        'Thảo luận Trợ giúp': 'help talk',
        'Thảo luận Thành viên': 'user talk',
        'Đặc biệt': 'special',
        'Tập tin': 'file',
        'Thảo luận Bản mẫu': 'template talk',
        'Bản mẫu': 'template',
        'Thảo luận': 'talk',
        'Thảo luận Tập tin': 'file talk',
        'Phương tiện': 'media',
        'Thảo luận Thể loại': 'category talk',
        'Thành viên': 'user',
        'Thảo luận MediaWiki': 'mediawiki talk' } },
  '#da.wikipedia': 
   { short: 'da',
     long: 'Danish Wikipedia',
     namespaces: 
      { 'Hjælp': 'help',
        Speciel: 'special',
        'MediaWiki diskussion': 'mediawiki talk',
        Bruger: 'user',
        Media: 'media',
        Fildiskussion: 'file talk',
        MediaWiki: 'mediawiki',
        Diskussion: 'talk',
        'Hjælp diskussion': 'help talk',
        Brugerdiskussion: 'user talk',
        Skabelon: 'template',
        Kategori: 'category',
        Skabelondiskussion: 'template talk',
        Kategoridiskussion: 'category talk',
        Fil: 'file',
        '$1 diskussion': 'project talk' } },
  '#wikidata.wikipedia': 
   { short: 'wd',
     long: 'Wikidata',
     namespaces: 
      { '': 'main',
        Category: 'category',
        Media: 'media',
        MediaWiki: 'mediawiki',
        Template: 'template',
        '$1 talk': 'project talk',
        'Help talk': 'help talk',
        User: 'user',
        'Template talk': 'template talk',
        'MediaWiki talk': 'mediawiki talk',
        Talk: 'talk',
        Help: 'help',
        'File talk': 'file talk',
        File: 'file',
        'User talk': 'user talk',
        Special: 'special',
        'Category talk': 'category talk' } } }


app.get('/cocytus', function (req, res){
    //console.log(req)
    //res.send('hello world');
  res.render('index', {
    title: 'wikistream',
    wikis: wikisobj,
    wikisSorted: wikisSorted,
    stream: true
  });
});

app.get('/commons-image/:page', function (req, res){
  var path = "/w/api.php?action=query&titles=" + 
             encodeURIComponent(req.params.page) + 
             "&prop=imageinfo&iiprop=url|size|comment|user&format=json";
  var opts = {
    headers: {'User-Agent': 'wikistream'},
    host: 'commons.wikimedia.org',
    path: path
  };
  http.get(opts, function (response) {
    //res.header('Content-Type', 'application/json');
    response.on('data', function (chunk) {
      res.setHeader('Cache-Control', 'public, max-age=1000')
      res.write(chunk);
    });
    response.on('end', function () {
      res.end();
    });
  });
});

app.get('/about/', function (req, res){
  res.render('about', {
    title: 'about wikistream',
    stream: false,
    trends: false
  });
});

app.listen(port_number);

// set up socket.io to stream the irc updates

var io = sio.listen(app);

var sioc = require( 'socket.io-client' );
var wmsocket = sioc.connect( 'stream.wikimedia.org/rc' );
console.log('loaded rcstream')

wmsocket.on( 'connect', function () {
     wmsocket.emit( 'subscribe', '*' );
    console.log('connected to rcsteram')
     } );
 
wmsocket.on( 'change', function ( data ) {
    //console.log( data );
    io.sockets.emit('message', data);
});

io.configure('production', function () {
  io.set('log level', 2);
});

// some proxy environments might not support all socketio's transports

io.set('transports', config.transports);

/* this is only really needed on inkdroid.org where wikistream was initially
 * deployed to inkdroid.org:3000 and cited there, which resulted
 * in google using inkdroid.org:3000 as the canonical URL for wikistream
 * this bit of middleware will permanently redirect :3000 requests that 
 * bypass the proxy to wikistream.inkdroid.org. Hopefully Google will 
 * update their index :-)
 */

function redirectOldPort(req, res, next) {
  if (req.header('host') == 'inkdroid.org:3000' 
          && ! req.header('x-forwarded-for')) {
    res.redirect('http://wikistream.inkdroid.org' + req.url, 301);
  } else {
    next();
  }
}
