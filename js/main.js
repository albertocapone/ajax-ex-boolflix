
function initVars() {
  // varie
   logo = new CircleType(document.getElementById('logo')).radius(600); //stilizzazione logo
   key = "99778220f31eec4fabbbe1461237e9d0";
  //contenitori
   mediaBox = $('.media_box');
   moviesBox = $('#movies');
   seriesBox = $('#tv-series');
   searchResultsBox = $('#search');
   favouritesBox = $('#favourites');
  //bottoni
   headbarNavigationButtons = $('.headbar a');
   genresButton = $('#genre_button');
   searchButton = $('.go');
  //form
   searchInput = $('.headbar > form');
  //preferiti
   bookmarked = cookie.get('favourites') ? cookie.get('favourites').split(',') : [];
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
   if (at <= 330) {
     headbarNavigationButtons.eq(0).addClass('active');
   } else if (at >= 331 && at <= 731) {
     headbarNavigationButtons.eq(1).addClass('active');
   } else if (at >= 732 && at <= 1100) {
     headbarNavigationButtons.eq(2).addClass('active');
   } else {
     headbarNavigationButtons.eq(3).addClass('active');
   } 
}

function displayLanguage(language, mode) { 
  var toFlag = {
    it: "img/it.png",
    gb: "img/gb.png",
    en: "img/en.png",
    us: "img/us.png",
    fr: "img/fr.png",
    de: "img/de.png",
    es: "img/es.png",
    pt: "img/pt.png",
    cn: "img/zh.png",
    ru: "img/ru.png",
    ja: "img/ja.png",
    zh: "img/zh.png"
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
  return (coverPath) ? "https://image.tmdb.org/t/p/" + "/w500/" + coverPath : "img/not-available.gif";
}

function getMedia(callType, searchingFor, queryData, targetBox) {
  $.ajax({
    url: "https://api.themoviedb.org/3/" + callType + "/" + searchingFor, 
    method: "GET",
    data: queryData,
    success: function (data) {
      var template = Handlebars.compile($('#template_media').html());
      var results = data.results; 
      results = results.filter((elm) => elm.poster_path && elm.overview.length > 25 && elm.id != 10784);
      for (var media of results) { 
        var checkDate = (searchingFor == "tv") ? media.first_air_date : media.release_date;
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
          year: checkDate ? checkDate.substring(0, 4) : "n.d.", 
          category: searchingFor.toUpperCase()
        };
        targetBox.append(template(context));
      }
      if (data.total_pages > data.page && targetBox.find('.media').length <= 100) {
        queryData.page++;
        getMedia(callType, searchingFor, queryData, targetBox);
      } 
      else {
        targetBox.find('.media').each(function() {
          console.log(bookmarked, String($(this).data('id')), bookmarked.includes(String($(this).data('id'))) );
          if (bookmarked.includes($(this).data('id')) && !$(this).find('.fa-bookmark').hasClass('active')) {
            $(this).find('.fa-bookmark').addClass('active');
            if (callType != 'search') {
              favouritesBox.append($(this).clone());
            }
          }
        });
        decodeGenres(targetBox, searchingFor);
      }
    },
    error: function (request, state, errors) {
      console.log(errors);    }
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
  location.hash = "";
  location.hash = "#search";
}

function getGenres() {
  for (let its = 0, type = "movie"; its < 2; its++, type = "tv") {
    $.ajax({
      url: "https://api.themoviedb.org/3/genre/" + type + "/list?", 
      method: "GET",
      data: {
        api_key: key,
      },
      success: function (data) {
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
        console.log(errors);
      }
    });
  }
}

function decodeGenres(targetBox) {
  targetBox.find('.media').each(function () {
    var media = $(this);
    var mediaCodes = $(this).data('genre');
    mediaCodes = (typeof mediaCodes === "string") ? mediaCodes.split(",") : [mediaCodes];
    var genresList = [];
    for (var code of mediaCodes) {
      $('#genres_list option').each(function() {
        if(code == $(this).val()){
          genresList.push($(this).html());
        }
      });
    }
    genresList = (genresList.length > 0) ? [...new Set(genresList)].join(', ') : "n.d.";
    media.find('.genre').html("<span>Genere: </span><span>" + genresList + "</span>");
  });
}


function manageFavourites() {
  if (!$(this).hasClass('active')) {
    var idMedia = $(this).parents('.media').data('id');
    bookmarked.push(idMedia);
    cookie.set('favourites', bookmarked);
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
    bookmarked = bookmarked.filter((id) => id != idMedia);
    cookie.set('favourites', bookmarked);
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
  document.getElementById('scrollable').scrollTo(0, 0);

  if (cookie.enabled()) {
    cookie.defaults.expires = 365;
  }
 
  //chiamate API di default
  getGenres();
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

  //ricerca 
  searchInput.on({
    focusin: function() {
      searchInput.find('input').val("");
    },
    focusout: function() {
      setTimeout(function() {searchInput.find('input').val("Cerca un film o una serie-tv...")}, 100);
    },
    keydown: function(e) { 
      if (e.which == 13) {
      e.preventDefault();
      document.getElementById('searchInput').blur();
      searchForMedia();
      }
    }
  });
  searchButton.click(searchForMedia);

  //filtro per generi
  genresButton.click(filterForGenre);

  //aggiungi a preferiti
  mediaBox.on("click", ".fa-bookmark", manageFavourites);
}

$(document).ready(init);
