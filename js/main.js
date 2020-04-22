$(document).ready(
  function() {
    // riferimenti html
    var searchResultsBox = $('.search_results');
    var template = Handlebars.compile($('#template_media').html());  //predispongo template

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
                language: media.original_language,
                score: media.vote_average
              }
            } else if (searchingFor == "tv") {
              var context = {                           //ad ogni iterazione sovrascrivo nell'oggetto context le proprieta di media di cui ho bisogno
                title: media.name,
                originalTitle: media.original_name,
                language: media.original_language,
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
