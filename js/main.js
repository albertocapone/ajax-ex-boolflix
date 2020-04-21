$(document).ready(
  function() {

    var template = Handlebars.compile($('#template_media').html());

    $('#go').click(
      function (){
        var userSearch = $('input').val();

        $.ajax({
          url: "https://api.themoviedb.org/3/search/movie",
          method: "GET",
          data: {
            api_key: "99778220f31eec4fabbbe1461237e9d0",
            query: userSearch,
          },
          success: function (data){
            var results = data.results;
            for (var key of results){
            var context = {
              title: key.title,
              originalTitle: key.original_title,
              language: key.original_language,
              score: key.vote_average
            }
            $('.search_results').append(template(context));
          }
          },
          error: function (request, state, errors){
            alert(errors);
          }
        });
    });
});
