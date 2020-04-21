$(document).ready(
  function() {
    // riferimenti html
    var searchResultsBox = $('.search_results');
    var template = Handlebars.compile($('#template_media').html());  //predispongo template

    $('#go').click(
      function (){
        searchResultsBox.html("");  //pulisco la box coi risultati di ricerca
        var userSearch = $('input').val(); //registro la stringa di ricerca inserita dall'utente
        $.ajax({
          url: "https://api.themoviedb.org/3/search/movie",
          method: "GET",
          data: {
            api_key: "99778220f31eec4fabbbe1461237e9d0",  //mia api key
            query: userSearch,                           //associo stringa ricerca utente
          },
          success: function (data){
            var results = data.results;                //registro array di oggetti estratto dalla proprieta results dell'oggetto data
            for (var key of results){                 //ciclo su array results   (key == results[k] in un for classico)
            var context = {                           //ad ogni iterazione sovrascrivo nell'oggetto context le proprieta di key di cui ho bisogno
              title: key.title,
              originalTitle: key.original_title,
              language: key.original_language,
              score: key.vote_average
            }
            searchResultsBox.append(template(context));   //inietto nel box dei risultati di ricerca il mio template valorizzato attraverso l'oggetto context dell'iterazione corrente 
          }
          },
          error: function (request, state, errors){
            alert(errors);
          }
        });
    });
});
