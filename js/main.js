
function initVars() {
  // varie
   logo = new CircleType(document.getElementById('logo')).radius(600); //stilizzazione logo
   key = "99778220f31eec4fabbbe1461237e9d0";
  //contenitori
   mediaBox = $('.media_box');
   latestBox = $('#latest');
   moviesBox = $('#movies');
   seriesBox = $('#tv-series');
   searchResultsBox = $('#search');
   favouritesBox = $('#favourites');
  //bottoni
   headbarNavigationButtons = $('.headbar a');
   genresButton = $('#genre_button');
   searchButton = $('.go');
  //preferiti
   bookmarked = [];
}

function headbarNavigation() {
  headbarNavigationButtons.each(function () {
    $(this).removeClass('active');
  });
  $(this).addClass('active');
}

function scrollbarHeadbarSync() {
   var at = mediaBox.scrollTop();
   headbarNavigationButtons.each(function () {
     $(this).removeClass('active');
   });
   if (at <= 513) {
     headbarNavigationButtons.eq(0).addClass('active');
   } else if (at >= 514 && at <= 961) {
     headbarNavigationButtons.eq(1).addClass('active');
   } else if (at >= 962 && at <= 1414) {
     headbarNavigationButtons.eq(2).addClass('active');
   } else if (at >= 1415 && at <= 1899) {
     headbarNavigationButtons.eq(3).addClass('active');
   } else {
     headbarNavigationButtons.eq(4).addClass('active');
   }
}

function displayLanguage(language, mode) { 
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
  if (mode == "img") {
    return toFlag[language] || ""; 
  } else if (mode == "txt") {
    return (toFlag[language] === undefined) ? language : ""; 
  }
}

function rateIt(vote) { 
  var starString = "";
  var starredVote = (vote == 0) ? 1 : Math.round(vote / 2);
  for (var stars = 0; stars < 5; stars++) {
    if (stars < starredVote) { 
      starString += "<i class='fas fa-star'></i>"; 
    } else { 
      starString += "<i class='far fa-star'></i>"; 
    }
  }
  return starString; 
}

function displayCover(coverPath) {
  return (coverPath) ? "https://image.tmdb.org/t/p/" + "/w342/" + coverPath : "img/not-available.gif";
}

function getMedia(callType, searchingFor, queryData, targetBox) {
  $.ajax({
    url: "https://api.themoviedb.org/3/" + callType + "/" + searchingFor, 
    method: "GET",
    data: queryData,
    success: function (data) {
      var template = Handlebars.compile($('#template_media').html());
      var results = data.results; 
      results = results.filter((elm) => elm.poster_path && elm.overview.length > 25);

      for (var media of results) { 
        var context = { 
          id: media.id,
          cover: displayCover(media.poster_path),
          title: (searchingFor == "tv") ? media.name : media.title,
          originalTitle: (searchingFor == "tv") ? media.original_name : media.original_title,
          flag: displayLanguage(media.original_language, "img"),
          language: displayLanguage(media.original_language, "txt"),
          score: rateIt(media.vote_average),
          overview: media.overview,
          genreData: media.genre_ids,
          year: ( (searchingFor == "tv") ?  media.first_air_date : media.release_date ).substring(0, 4), //attento, date undefined
          category: searchingFor.toUpperCase()
        };
        targetBox.append(template(context));
      }

      if (callType === "search") {
        searchResultsBox.find('.media').each(function() {
          console.log(bookmarked, $(this).data('id'), bookmarked.includes($(this).data('id')))
            if ( bookmarked.includes($(this).data('id'))) {
                $(this).find('.fa-bookmark').addClass('active');
            }
        });
      }
      if (data.total_pages > data.page && data.page < 10) {
        queryData.page++;
        getMedia(callType, searchingFor, queryData, targetBox);
      } 
      if (data.page == 9) {
        decodeGenres(targetBox, searchingFor);
      }
    },
    error: function (request, state, errors) {
      alert(errors);
    }
  });
}

function searchForMedia() {
  searchResultsBox.html("");
  getMedia("search", "movie", {
    api_key: key,
    query: $('input').val(), 
    page: 1
  }, searchResultsBox);
  getMedia("search", "tv", {
    api_key: key,
    query: $('input').val(),
    page: 1
  }, searchResultsBox);
  location.hash = "#search";
}

function getGenres() {
  for (var its = 0, type = "movie"; its < 2; its++, type = "tv") {
    $.ajax({
      url: "https://api.themoviedb.org/3/genre/" + type + "/list?", 
      method: "GET",
      data: {
        api_key: key,
      },
      success: function (data) {
        console.log("called ajax")
        var template = Handlebars.compile($('#template_genreFilter_options').html());
        var genresList = [];
        for (var entry of data.genres) {
          if (!genresList.some(item => item.id === entry.id)) {
            genresList.push(entry);
            var context = {
              genreName: entry.name,
              genreCode: entry.id
            };
            $('#genre_button + select').append(template(context));
          }
        }
      },
      error: function (request, state, errors) {
        alert(errors);
      }
    });
  }
}

function decodeGenres(targetBox, type) {
    $.ajax({
      url: "https://api.themoviedb.org/3/genre/" + type + "/list?",
      method: "GET",
      data: {
        api_key: key,
      },
      success: function (data) {
        targetBox.find('.media').each(function() {
        var mediaCodes = $(this).data('genre').split(',');
        var genresList = "";
          for (var entry of data.genres){
            for(var mediaCode of mediaCodes){
            if (mediaCode == entry.id) {
              genresList += "\n" + entry.name;
            }
           }
          }
          $(this).find('.genre').html("<span>Genere:</span><span>" + genresList + "</span>");
      });
      },
      error: function (request, state, errors) {
        alert(errors);
      }
    });
}


function manageFavourites() {

  if (!$(this).hasClass('active')) {
    var idMedia = $(this).parents('.media').data('id');
    bookmarked.push(idMedia);
    favouritesBox.append($(this).parents('.media').clone());
    $('.media').each(function () {
      if ($(this).data('id') === idMedia)
        $(this).find('.fa-bookmark').addClass('active');
    });
  } else {
    var idMedia = $(this).parents('.media').data('id');
    $('.media').each(function () {
      if ($(this).data('id') === idMedia)
        $(this).find('.fa-bookmark').removeClass('active');
    });
    favouritesBox.children().each(function () {
       if ($(this).data('id') === idMedia)
        $(this).remove();
    });
    bookmarked = bookmarked.filter((id) => id !== idMedia);
  }
}

function filterForGenre() {
  $(this).toggleClass('active');
  $(this).siblings('select').toggle();
  $(this).siblings('select').click(
  function () {
    var filter = $(this).val();
    if (filter == "all") {
      $('.media').each(function () {
        $(this).show();
      });
    } else {
      $('.media').each(function () {
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
}

function init() {

  initVars();
  location.hash = "#latest"; //indirizza la view su #latest

  //chiamate API di default
  getGenres();
  getMedia("discover", "movie", {
    api_key: key,
    sort_by: "release_date.desc, popularity.desc, vote_average.desc",
    page: 1
  }, latestBox);
  getMedia("discover", "tv", {
    api_key: key,
    sort_by: "release_date.desc, popularity.desc, vote_average.desc",
    page: 1
  }, latestBox);
  getMedia("discover", "movie", {
    api_key: key,
    sort_by: "popularity.desc",
    page: 1
  }, moviesBox);
  getMedia("discover", "tv", {
    api_key: key,
    sort_by: "popularity.desc",
    page: 1
  }, seriesBox);

  //navigazione da bottoni headbar e relativo aggiornamento scrollbar
  headbarNavigationButtons.click(headbarNavigation);
  mediaBox.scroll(scrollbarHeadbarSync);

  //ricerca manuale
  searchButton.click(searchForMedia);

  //filtro per generi
  genresButton.click(filterForGenre);

  //aggiungi a preferiti
  mediaBox.on("click", ".fa-bookmark", manageFavourites);
}

$(document).ready(init);
