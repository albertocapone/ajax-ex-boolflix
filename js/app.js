/* Variables */
function initVars() { //le variabili vengono dichiarate senza keyword in modo che invocata initVars il loro scope sia globale

  //varie
  logo = new CircleType(document.getElementById("logo")).radius(600); //stilizzazione logo
  keyAPI = "99778220f31eec4fabbbe1461237e9d0";

  //contenitori
  mediaBox = $("#media_box");
  moviesBox = $("#movies");
  seriesBox = $("#tv-series");
  searchResultsBox = $("#search");
  favouritesBox = $("#favourites");
  genresFilterBox = $("#genres_list");

  //bottoni
  headbarNavigationButtons = $(".headbar a");
  genresButton = $("#genre_button");
  searchButton = $("#go");
  page_switchers = $(".page_switchers button");
  page_index = $(".page_index");


  //form
  searchInput = $("#searchInput");

  //Application State 
  state = {
    movies: {
      totalPages: null,
      currentPage: 1,
      data: [],
    },
    series: {
      totalPages: null,
      currentPage: 1,
      data: [],
    },
    favs: {
      totalPages: null,
      currentPage: 1,
      data: [],
      onPage: []
    },
    search: {
      query: null,
      totalPages: null,
      currentPage: 1,
      data: [],
    },
    genres: []
  };

  handlestate = {
    set: (target, prop, value) => {
      if(prop === "favs") console.log('favs proxy');
      resetfilters();
      target[prop] = value;
      updateDOM(prop);
      return true;
    }
  };

  state = new Proxy(state, handlestate);

  //Ajax Defaults
  ajaxDefaults = {
    url: 'https://api.themoviedb.org/3/',
    method: 'GET',
    data: {
      api_key: keyAPI,
      sort_by: "popularity.desc",
    }
  };

}
/* ---------- */

/* Media Info */
const displayLanguage = (language, mode) => {

  const toFlag = {
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

const rateIt = (vote) => {

  const starredVote = (vote == 0) ? 1 : Math.round(vote / 2);
  let starString = "";

  for (let stars = 0; stars < 5; stars++) {

    if (stars < starredVote)  starString += "<i class='fas fa-star'></i>";
    else  starString += "<i class='far fa-star'></i>";
  
  }
  return starString;

}

const displayCover = (coverPath) => {
  return (coverPath) ? `https://image.tmdb.org/t/p//w500/${coverPath}` : "img/no_image.jpeg";

}

const translateGenres = (mediaGenreCodes = []) => {
  
  const genresTable = state.genres;
  let genresList = [];

  for(let e = 0; e < mediaGenreCodes.length; e++) {
    let code = mediaGenreCodes[e];
    for(let i = 0; i < genresTable.length; i++) {
      if(code === genresTable[i].id) {
        genresList.push(genresTable[i].name);
        break;
      }
    }
  }

  return genresList.join(' ') || 'n.d.';
}
/* ------------- */

/* API Calls */
async function getMovies(page = 1) {

  const ajaxObject = {
    ...ajaxDefaults
  };
  ajaxObject.data.page = page;
  
  ajaxObject.url += 'discover/movie';
  const movies = await $.ajax(ajaxObject);

  state.movies = {
    totalPages: movies.total_pages,
    currentPage: page,
    data: movies.results
  }

}

async function getTVSeries(page = 1) {

  const ajaxObject = {
    ...ajaxDefaults
  };
  ajaxObject.data.page = page;

  ajaxObject.url += "discover/tv";
  const TVseries = await $.ajax(ajaxObject);

  state.series = {
    totalPages: TVseries.total_pages,
    currentPage: page,
    data: TVseries.results
  };

}

async function search(e, page = 1) {

  if (!searchInput.val().trim().length) return;

  const ajaxObject = {
    ...ajaxDefaults,
  };
  ajaxObject.data.page = page;
  ajaxObject.data.query = state.search.query ?? searchInput.val();

  const url = ajaxObject.url;
  let data;

  ajaxObject.url = `${url}search/movie`;
  const movies = await $.ajax(ajaxObject) ?? [];

  ajaxObject.url = `${url}search/tv`;
  const tv = await $.ajax(ajaxObject) ?? [];

  data = movies.results.concat(tv.results);

  try {
    state.search = {
      query: ajaxObject.data.query,
      totalPages: (movies.total_pages >= tv.total_pages) ? movies.total_pages : tv.total_pages,
      currentPage: page,
      data: data,
    };
  } catch (err) {
    console.log(err);
    state.search = {
      query: null,
      totalPages: null,
      currentPage: 1,
      data: [],
    };
  }

}

async function getGenres() {

  const ajaxObject = {
    ...ajaxDefaults,
  };

  const url = ajaxObject.url;

  ajaxObject.url = url + 'genre/movie/list?';
  const movie = (await $.ajax(ajaxObject)) ?? [];

  ajaxObject.url = url + "genre/tv/list?";
  const tv = (await $.ajax(ajaxObject)) ?? [];

  const genres = movie.genres.concat(tv.genres);
  const sortedGenres = [...new Map( genres.map( genreObj => [genreObj['id'], genreObj] ) ).values()];

  state.genres = sortedGenres;

}
/* ------------- */

/* DOM Update */
const mediaTemplating = (data, targetBox) => {

  const template = Handlebars.compile($("#template_media").html());

  targetBox.html("");

  for (const media of data) {

    const checkDate = media.first_air_date ?? media.release_date;
    
    const context = {
      id: media.id,
      cover: displayCover(media.poster_path),
      title: media.name ?? media.title,
      originalTitle: media.original_name ?? media.original_title,
      flag: displayLanguage(media.original_language, "img"),
      language: displayLanguage(media.original_language, "txt"),
      score: rateIt(media.vote_average),
      overview: media.overview,
      genreData: media.genre_ids,
      genres: translateGenres(media.genre_ids),
      year: checkDate ? checkDate.substring(0, 4) : "n.d.",
    };

    targetBox.append(template(context));
  }

}

const genresTemplating = () => {

  const template = Handlebars.compile($('#template_genreFilter_options').html());

  for (const genre of state.genres) {

     const context = {
       genreName: genre.name,
       genreCode: genre.id,
     };

     genresFilterBox.append(template(context));
  }

}

const updateDOM = (prop) => {

  switch (prop) {
    case "movies":
      mediaTemplating(state.movies.data, moviesBox);
      showPagesIndex(prop);
      checkForFavs(moviesBox);
      break;

    case "series":
      mediaTemplating(state.series.data, seriesBox);
      showPagesIndex(prop);
      checkForFavs(seriesBox);
      break;

    case "search":
      mediaTemplating(state.search.data, searchResultsBox);
      showPagesIndex(prop);
      checkForFavs(searchResultsBox);
      mediaBox.scrollTop(1800);
      break;

    case "favs":
      mediaTemplating(state.favs.onPage, favouritesBox);
      showPagesIndex(prop);
      checkForFavs(favouritesBox); 
      saveFavsToStorage();
      break;

    case "genres":
      genresTemplating();
      break;
  }

}
/* --- */

/* Favourites */
const getFavsFromStorage = (page = 1) => {
   
  const favourites = window.localStorage.getItem("favourites") ? JSON.parse(window.localStorage.getItem("favourites")) : [],
        resultsPerPage = 20,
        totalPages = Math.ceil(favourites.length / resultsPerPage),
        first = (page - 1) * resultsPerPage,
        last = first + resultsPerPage;

  state.favs = {
    totalPages: totalPages || 1,
    currentPage: page,
    data: favourites,
    onPage: favourites.slice(first, last)
  };
    
};

const recalculateFavs = (favs) => {

  const resultsPerPage = 20,
    totalPages = Math.ceil(favs.length / resultsPerPage),
    page = (state.favs.currentPage <= totalPages) ? state.favs.currentPage : totalPages,
    first = (page - 1) * resultsPerPage,
    last = first + resultsPerPage;

  state.favs = {
    totalPages: totalPages || 1,
    currentPage: page,
    data: favs,
    onPage: favs.slice(first, last),
  };

}

const saveFavsToStorage = () => {
  window.localStorage.setItem("favourites", JSON.stringify(state.favs.data));
};

function add_n_remove_Favs() {

  const bookmark = $(this),
        media = $(this).parents(".media"),
        mediaID = media.data('id'),
        box = media.parent().siblings(".page_switchers").data("box");

  let updatedFavs;

  if( bookmark.hasClass("active") ) {
    $(".media").each( function() { if( $(this).data('id') === mediaID) $(this).find(".bookmark").removeClass("active") } );
    updatedFavs = state.favs.data.filter((fav) => fav.id !== mediaID);
    recalculateFavs(updatedFavs);
  } 
  else if( !bookmark.hasClass("active") ) {
    bookmark.addClass("active");
    updatedFavs = state[box].data.find((elm) => elm.id === mediaID);
    recalculateFavs(state.favs.data.concat(updatedFavs));
  }

}

const checkForFavs = (box) => {

  box.children().each( function() {
    for(let media of state.favs.data) {
      if( media.id === $(this).data('id') ) {
        $(this).find(".bookmark").addClass("active");
    }
    }
  });
  
}
/* -------- */

/* Pagination */
function page_switch() {

  const box = $(this).parent().data("box"),
        direction = $(this).attr("class"),
        currentPage = state[box].currentPage,
        total_pages = state[box].totalPages,
        nextPage = (direction === 'page-up') ? currentPage + 1 : currentPage - 1;

  if (direction === "page-up" && currentPage < total_pages || direction === "page-down" && currentPage > 1) {

    switch (box) {
      case 'movies':
          getMovies(nextPage);
        break;
  
      case 'series':
          getTVSeries(nextPage);
        break;
  
      case 'favs':
          getFavsFromStorage(nextPage);
        break;
  
      case 'search':
          search('no-event', nextPage);
        break;
    }
  }

}

const showPagesIndex = (prop) => {

  const box = page_index.filter( function() { return $(this).parent().data("box") === prop } ),
        pagesIndex = `<span>${state[prop].currentPage} - ${state[prop].totalPages}</span>`;
        
  box.html("");
  box.append(pagesIndex);

}
/* ------------ */

/* Filters */
function filterForGenre() {

  const filter = $(this).val();

  if (filter == "all") {

    $(".media").each(function () { $(this).show() });

  } else {

    $(".media").each(function () {

      let mediaGenreCodes = $(this).data("genre");

      mediaGenreCodes = typeof mediaGenreCodes === "string" ?
        mediaGenreCodes.split(",") 
        :
        [mediaGenreCodes];

      if ( mediaGenreCodes.some((code) => code == filter) ) $(this).show();
      else $(this).hide();
      
    });
  }

}

const resetfilters = () => {

  $(".media").each(function () { $(this).show() } );
  genresButton.removeClass("active");
  genresFilterBox.hide();

}
/* -------- */

/* Navigation */
function headbarNavigation() {

  headbarNavigationButtons.each(function () {
    $(this).removeClass('active');
  });

  $(this).addClass('active');

}

function scrollbarHeadbarSync() {

  const at = mediaBox.scrollTop();

  headbarNavigationButtons.each(function () {
    $(this).removeClass('active');
  });

  if (at <= 697) headbarNavigationButtons.eq(0).addClass('active');
  else if (at >= 698 && at <= 1305) headbarNavigationButtons.eq(1).addClass('active');
  else if (at >= 1306 && at <= 1747) headbarNavigationButtons.eq(2).addClass('active');
  else  headbarNavigationButtons.eq(3).addClass('active');
  
}
/* ---------- */

const setup = () => {
  getGenres().then( () => {
    getFavsFromStorage();
    getMovies();
    getTVSeries();
  });
}

/* App */
const Boolflix = () => {

  initVars();     //per organizzare meglio il codice, le variabili vengono dichiarate all'interno di initVars

  setup();

  /* Listeners */
  page_switchers.click(page_switch);

  genresButton.click(() => {
    genresButton.toggleClass("active");
    genresFilterBox.toggle();
    genresFilterBox.click(filterForGenre);
  });

  mediaBox.on("click", ".bookmark", add_n_remove_Favs);

  searchButton.click(search);

  searchInput.on({
    focusin: () => {
      searchInput.val("");
    },
    focusout: () => {
      setTimeout( () => {
        searchInput.val("Cerca un film o una serie-tv...");
      }, 100);
    },
    keydown: (e) => {
      if (e.which == 13) {
        e.preventDefault();
        document.getElementById("searchInput").blur();
        search();
      }
    },
  });

  headbarNavigationButtons.click(headbarNavigation);
  mediaBox.scroll(scrollbarHeadbarSync);
 /* ------- */
 
}
/* --- */
$(document).ready(Boolflix);