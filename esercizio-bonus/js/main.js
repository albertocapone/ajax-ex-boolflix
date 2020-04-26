$(document).ready(
  function() {
    // riferimenti html
    var logo = new CircleType(document.getElementById('logo')).radius(600);   //stilizzazione logo
    var template = Handlebars.compile($('#template_media').html());  //predispongo template
    var key = "99778220f31eec4fabbbe1461237e9d0";

    var mediaBox = $('.media_box');
    var popularBox = $('#popular');
    var moviesBox = $('#movies');
    var seriesBox = $('#tv-series');
    var searchResultsBox = $('#search');
    var favouritesBox = $('#favourites');

    var headbarNavigationButtons = $('.headbar li');
    var searchButton = $('#go');



    function displayLanguage(language, mode){  //a seconda del parametro mode gestisco l'alternanza tra display di immagine per una determinata lingua, se esiste, oppure display di testo, se non esiste
      var toFlag = {
        it: "img/it.png",
        gb: "img/gb.png",
        en: "img/gb.png",
        us: "img/us.png",
        fr: "img/fr.png",
        de: "img/de.png",
        es: "img/es.png",
        pt: "img/pt.png",
        cn: "img/cn.png",
        ru: "img/ru.png"
      };
      if(mode == "img"){
      return toFlag[language] || "";      //ritorno la stringa-img risultante dall' accesso all'oggetto attraverso il parametro language (che è la prop language del media corrente) oppure se non esiste una stinga vuota
      } else if(mode == "txt"){
      return (toFlag[language] === undefined) ? language : ""; //se non c'è un img per quella lingua allora mostro del testo semplice viceversa il testo è vuoto
      }
    }

    function rateIt(vote){       //questa funzione traduce il voto del media corrente in stelle
      var starString = "";
      var starredVote = Math.round(vote / 2);     //converto il voto
      for (var stars = 0; stars < 5; stars++){
        if (stars < starredVote) {              //per iterazioni inferiori alla valutazione in stelle
          starString += "<i class='fas fa-star'></i>";   //aggiungi stella piena
        } else {                                //per tutte le altre
          starString += "<i class='far fa-star'></i>";  //aggiungi stella vuota
        }
      }
      return starString;     //la funzione ritorna una stringa che verrò poi convertita in oggetti jquery da handlebars
    }

    function displayCover (coverPath){
        return (coverPath) ? "https://image.tmdb.org/t/p/"+ "/w342/" + coverPath : "img/not-available.gif";
    }

    function callTheAPI(callType, searchingFor, data, appendTo) {
      $.ajax({
        url: "https://api.themoviedb.org/3/" + callType + "/" + searchingFor,   //l'url viene modificato in base alla ricerca
        method: "GET",
        data: data,
        success: function (data){
          var results = data.results;                //registro array di oggetti estratto dalla proprieta results dell'oggetto data
          for (var media of results){                 //ciclo su array results   (media == results[k] in un for classico)
              var context = {                        //ad ogni iterazione sovrascrivo nell'oggetto context le proprieta di key di cui ho bisogno
                cover: displayCover(media.poster_path),
                title: (searchingFor == "movie") ? media.title : media.name,
                originalTitle: (searchingFor == "movie") ? media.original_title : media.original_name ,
                flag: displayLanguage(media.original_language, "img"),
                language: displayLanguage(media.original_language, "txt"),
                score: rateIt(media.vote_average),
                overview: media.overview || "non disponibile..."
              }
              appendTo.append(template(context));
          }
        },
        error: function (request, state, errors){
          alert(errors);
        }
      });
    }

    //headbar and scrolling navigation
    headbarNavigationButtons.click(
      function () {
        headbarNavigationButtons.each(function () { $(this).removeClass('active'); });
        $(this).addClass('active');
      }
    );

    mediaBox.scroll(
      function() {
          var at = mediaBox.scrollTop();
          headbarNavigationButtons.each(function () { $(this).removeClass('active'); });
          if (at <= 513) {
            headbarNavigationButtons.eq(0).addClass('active');
          } else if (at >= 514 && at <= 961) {
            headbarNavigationButtons.eq(1).addClass('active');
          } else if (at >= 962 && at <= 1414){
            headbarNavigationButtons.eq(2).addClass('active');
          } else if (at >= 1415 && at <= 1899) {
            headbarNavigationButtons.eq(3).addClass('active');
          } else {
            headbarNavigationButtons.eq(4).addClass('active');
          }
      }
    );

    //search
    searchButton.click(
      function (){
        searchResultsBox.html("");
        callTheAPI("search", "movie", {
          api_key: key,
          query: $('input').val()   //registro la stringa di ricerca inserita dall'utente
        }, searchResultsBox);
        callTheAPI("search", "tv", {
          api_key: key,
          query: $('input').val()    //registro la stringa di ricerca inserita dall'utente
        }, searchResultsBox);
      //sposta scrollbar
    });

    //add to favourites
    mediaBox.on("click", ".fa-bookmark",
      function() {
        if ($(this).hasClass('active')){
          var bookmarkedMedia = $(this).parents('.media');
          favouritesBox.find(bookmarkedMedia).remove();
          $('.media').each( function () {
            if ( $(this).find('.sorting_title').html() == bookmarkedMedia.find('.sorting_title').html() ) {
              $(this).find(".fa-bookmark").removeClass('active');
            }
          });
        } else {
          var toBookmarkMedia = $(this).parents('.media');
          favouritesBox.append(toBookmarkMedia.clone());
          $('.media').each( function () {
            if ( $(this).find('.sorting_title').html() == toBookmarkMedia.find('.sorting_title').html() ) {
              $(this).find(".fa-bookmark").addClass('active');
            }
          });
        }
      }
    );

    //genre filter

    //start page API calls
    callTheAPI("discover", "movie",{
      api_key: key,
      sort_by: "popularity.desc"
    }, popularBox);
    callTheAPI("discover", "movie",{
      api_key: key,
      sort_by: "release_date.desc"
    }, moviesBox) ;
    callTheAPI("discover", "tv",{
      api_key: key,
      sort_by: "release_date.desc"
    }, seriesBox);
});
