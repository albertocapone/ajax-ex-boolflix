$(document).ready(
  function() {
    //riferimenti html

    // varie
    var logo = new CircleType(document.getElementById('logo')).radius(600);   //stilizzazione logo
    var key = "99778220f31eec4fabbbe1461237e9d0";

    //contenitori
    var mediaBox = $('.media_box');
    var popularBox = $('#popular');
    var moviesBox = $('#movies');
    var seriesBox = $('#tv-series');
    var searchResultsBox = $('#search');
    var favouritesBox = $('#favourites');

    //bottoni
    var headbarNavigationButtons = $('.headbar a');
    var genresButton = $('#genre_button');
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

    function getMedia(callType, searchingFor, data, appendTo) {
      $.ajax({
        url: "https://api.themoviedb.org/3/" + callType + "/" + searchingFor,   //l'url viene modificato in base alla ricerca
        method: "GET",
        data: data,
        success: function (data){
          var template = Handlebars.compile($('#template_media').html());
          var results = data.results;                //registro array di oggetti estratto dalla proprieta results dell'oggetto data
          for (var media of results){                 //ciclo su array results   (media == results[k] in un for classico)
              var context = {                        //ad ogni iterazione sovrascrivo nell'oggetto context le proprieta di key di cui ho bisogno
                cover: displayCover(media.poster_path),
                title: (searchingFor == "tv") ? media.name : media.title,
                originalTitle: (searchingFor == "tv") ? media.original_name : media.original_title,
                flag: displayLanguage(media.original_language, "img"),
                language: displayLanguage(media.original_language, "txt"),
                score: rateIt(media.vote_average),
                overview: media.overview || "non disponibile...",
                genreData: media.genre_ids,
                // genre: stringifyGenres(media.genre_ids, searchingFor, function(data) {return data;})
              };
              appendTo.append(template(context));
          }
        },
        error: function (request, state, errors){
          alert(errors);
        }
      });
    }

    //recupero lista generi da API
    function getGenres() {
      for (var its = 0, type = "movie"; its < 2; its++, type = "tv"){
      $.ajax({
        url: "https://api.themoviedb.org/3/genre/" + type + "/list?",   //l'url viene modificato in base alla ricerca
        method: "GET",
        data: {
          api_key: key,
        },
        success: function (data){
          var template = Handlebars.compile($('#template_genreFilter_options').html());
          var genresList = [];
          for (var entry of data.genres){
          if ( !genresList.some(item => item.id === entry.id) ) {
          genresList.push(entry);
          var context = {
            genreName: entry.name,
            genreCode: entry.id
          };
          $('#genre_button + select').append(template(context));
        }
      }
      },
        error: function (request, state, errors){
          alert(errors);
        }
      });
    }
  }

  // function stringifyGenres(mediaGenreCodes, type, callback) {
  //   $.ajax({
  //     url: "https://api.themoviedb.org/3/genre/" + type + "/list?",   //l'url viene modificato in base alla ricerca
  //     method: "GET",
  //     data: {
  //       api_key: key,
  //     },
  //     success: function (data){
  //       mediaGenreCodes = (typeof mediaGenreCodes === "string") ? mediaGenreCodes.split(",") : [mediaGenreCodes];
  //       var genreString = "";
  //     for (var it = 0; it < mediaGenreCodes.length; it++){
  //       for (var entry of data.genres){
  //         if (mediaGenreCodes[it] == entry.id) {
  //            genreString += entry.name;
  //          }
  //       }
  //     }
  //     callback(genreString);
  //   },
  //     error: function (request, state, errors){
  //       alert(errors);
  //     }
  //   });
  // }

    //navigazione da bottoni headbar e relativo aggiornamento scrollbar
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

    //ricerca manuale
    searchButton.click(
      function (){
        searchResultsBox.html("");
        getMedia("search", "movie", {
          api_key: key,
          query: $('input').val()
        }, searchResultsBox);
        getMedia("search", "tv", {
          api_key: key,
          query: $('input').val()
        }, searchResultsBox);
      //porta scrollbar in basso
    });

    //aggiungi a preferiti
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
      });


    //filtro per generi
    genresButton.click(
      function() {
        $(this).toggleClass('active');
        $(this).siblings('select').toggle();
          $(this).siblings('select').click(
            function() {
              var filter = $(this).val();
              if (filter == "all"){
                $('.media').each( function () { $(this).show(); } );
              } else {
              $('.media').each( function () {
                var mediaGenreCodes = $(this).data("genre");
                mediaGenreCodes = (typeof mediaGenreCodes === "string") ? mediaGenreCodes.split(",") : [mediaGenreCodes];
                if (mediaGenreCodes.some(item => item == filter)) {
                  $(this).show();
                } else {
                  $(this).hide();
                }
              });
            }
        });
    });

    //chiamate API di default
    getGenres();
    getMedia("discover", "movie",{
      api_key: key,
      sort_by: "popularity.desc"
    }, popularBox);
    getMedia("discover", "tv",{
      api_key: key,
      sort_by: "popularity.desc"
    }, popularBox);
    getMedia("discover", "movie",{
      api_key: key,
      sort_by: "primary_release_date.desc"
    }, moviesBox) ;
    getMedia("discover", "tv",{
      api_key: key,
      sort_by: "primary_release_date.desc"
    }, seriesBox);

});
