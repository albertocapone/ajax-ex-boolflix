$(document).ready(
  function() {
    // riferimenti html
    var searchResultsBox = $('.search_results');
    var template = Handlebars.compile($('#template_media').html());  //predispongo template

    function displayLanguage(language, mode){  //a seconda del parametro mode gestisco l'alternanza tra display di immagine per una determinata lingua, se esiste, oppure display di testo, se non esiste
      var toFlag = {          //creo un oggetto di corrispondenze codici paesi -> img paesi; ogni stringa-img verrà inserita in img all'interno del template
        it: "img/it.png",
        gb: "img/gb.png",
        us: "img/us.png",
        fr: "img/fr.png",
        es: "img/es.png",
        pt: "img/pt.png"
      };
      if(mode == "img"){
      return toFlag[language] || "";      //ritorno la stringa-img risultante dall' accesso all'oggetto attraverso il parametro language (che è la prop language del media corrente) oppure se non esiste una stinga vuota
      } else if(mode == "txt"){
      return (toFlag[language] === undefined) ? language : ""; //se non c'è un img per quella lingua allora mostro del testo semplice viceversa il testo è vuoto
      }
    }

    function rateIt(vote){
      return; //stars
    }

    function callTheAPI(query, searchingFor){
      $.ajax({
        url: "https://api.themoviedb.org/3/search/" + searchingFor, //l'url viene modificato in base alla ricerca
        method: "GET",
        data: {
          api_key: "99778220f31eec4fabbbe1461237e9d0",  //mia api key
          query: query,                           //associo stringa ricerca utente
        },
        success: function (data){
          var results = data.results;                //registro array di oggetti estratto dalla proprieta results dell'oggetto data
          for (var media of results){                 //ciclo su array results   (media == results[k] in un for classico)
            if(searchingFor == "movie"){
              var context = {                        //ad ogni iterazione sovrascrivo nell'oggetto context le proprieta di key di cui ho bisogno
                title: media.title,
                originalTitle: media.original_title,
                flag: displayLanguage(media.original_language, "img"),
                language:  displayLanguage(media.original_language, "txt"),
                score: media.vote_average
              }
            } else if (searchingFor == "tv") {
              var context = {                           //ad ogni iterazione sovrascrivo nell'oggetto context le proprieta di media di cui ho bisogno
                title: media.name,
                originalTitle: media.original_name,
                flag: displayLanguage(media.original_language, "img"),
                language: displayLanguage(media.original_language, "txt"),
                score: media.vote_average
              }
            }
            searchResultsBox.append(template(context));   //inietto nel box dei risultati di ricerca il mio template valorizzato attraverso l'oggetto context dell'iterazione corrente
        }
        },
        error: function (request, state, errors){
          alert(errors);
        }
      });
    }

    $('#go').click(
      function (){
        searchResultsBox.html("");  //pulisco la box coi risultati di ricerca
        var userSearch = $('input').val(); //registro la stringa di ricerca inserita dall'utente
        callTheAPI(userSearch, "movie");
        callTheAPI(userSearch, "tv");
    });
});
