# Синхронизация с shikimori

## API

### Поиск

GET https://www.anilibria.top/api/v1/app/search/releases?query=<query>

```json
[
    {
        "id": 6836,
        "type": {
            "value": "TV",
            "description": "ТВ"
        },
        "year": 2018,
        "name": {
            "main": "Анголмуа: Хроники борьбы с монгольским нашествием",
            "english": "Angolmois: Genkou Kassenki",
            "alternative": null
        },
        "alias": "angolmois-genkou-kassenki",
        "season": {
            "value": "summer",
            "description": "Лето"
        },
        "poster": {
            "src": "/storage/releases/posters/6836/47ardTOEGxxreOYbKtChp3XdNFws85xm.jpg",
            "preview": "/storage/releases/posters/6836/47ardTOEGxxreOYbKtChp3XdNFws85xm.jpg",
            "thumbnail": "/storage/releases/posters/6836/o4vzxkfeTW9T4Khx2vJAuvEj9m1tYeQh.jpg",
            "optimized": {
                "src": "/storage/releases/posters/6836/0hYSL5j9gtlGBj6dkHn15UE5ngZZWPtT.webp",
                "preview": "/storage/releases/posters/6836/0hYSL5j9gtlGBj6dkHn15UE5ngZZWPtT.webp",
                "thumbnail": "/storage/releases/posters/6836/KKMLKMi6lBiF04wAiV1aho1Tdk5XaOVX.webp"
            }
        },
        "fresh_at": "2018-09-26T17:22:41+00:00",
        "created_at": "2018-09-26T17:22:41+00:00",
        "updated_at": "2024-08-02T19:52:16+00:00",
        "is_ongoing": false,
        "age_rating": {
            "value": "R16_PLUS",
            "label": "16+",
            "is_adult": false,
            "description": "Для людей, достигших возраста шестнадцати лет (16+)"
        },
        "publish_day": {
            "value": 1,
            "description": "Понедельник"
        },
        "description": "...",
        "notification": null,
        "episodes_total": 12,
        "external_player": "",
        "is_in_production": false,
        "is_blocked_by_geo": false,
        "is_blocked_by_copyrights": false,
        "added_in_users_favorites": 2155,
        "average_duration_of_episode": 25,
        "added_in_planned_collection": 65,
        "added_in_watched_collection": 49,
        "added_in_watching_collection": 8,
        "added_in_postponed_collection": 1,
        "added_in_abandoned_collection": 2
    }
]
```

# Detail info

* GET https://www.anilibria.top/api/v1/anime/releases/<alias or id>

https://www.anilibria.top/api/v1/anime/releases/9427

```json
{
  "id": 9427,
  "type": {
    "value": "TV",
    "description": "ТВ"
  },
  "year": 2023,
  "name": {
    "main": "Смертельная игра мёртвой горы",
    "english": "Dead Mount Death Play",
    "alternative": null
  },
  "alias": "dead-mount-death-play",
  "season": {
    "value": "spring",
    "description": "Весна"
  },
  "poster": {
    "src": "/storage/releases/posters/9427/AJ1xmkZ4TMs5eyTluXcedNiUun3tEcHm.jpg",
    "preview": "/storage/releases/posters/9427/AJ1xmkZ4TMs5eyTluXcedNiUun3tEcHm.jpg",
    "thumbnail": "/storage/releases/posters/9427/E9ZlXcygjy6nn4SLui0cVV7xywF4RQWz.jpg",
    "optimized": {
      "src": "/storage/releases/posters/9427/OvJF4jZlrAbNqTS8FZrZo8KrJQw8HPjf.webp",
      "preview": "/storage/releases/posters/9427/OvJF4jZlrAbNqTS8FZrZo8KrJQw8HPjf.webp",
      "thumbnail": "/storage/releases/posters/9427/uqJu5Cib6BMkhkPqc0Rc1mAhVvIzpVSj.webp"
    }
  },
  "fresh_at": "2023-06-27T23:51:12+00:00",
  "created_at": "2023-03-08T00:59:48+00:00",
  "updated_at": "2024-08-02T19:56:36+00:00",
  "is_ongoing": false,
  "age_rating": {
    "value": "R16_PLUS",
    "label": "16+",
    "is_adult": false,
    "description": "Для людей, достигших возраста шестнадцати лет (16+)"
  },
  "publish_day": {
    "value": 3,
    "description": "Среда"
  },
  "description": "...",
  "notification": null,
  "episodes_total": 12,
  "external_player": null,
  "is_in_production": false,
  "is_blocked_by_geo": false,
  "is_blocked_by_copyrights": false,
  "added_in_users_favorites": 13057,
  "average_duration_of_episode": null,
  "added_in_planned_collection": 312,
  "added_in_watched_collection": 1567,
  "added_in_watching_collection": 116,
  "added_in_postponed_collection": 53,
  "added_in_abandoned_collection": 85,
  "genres": [
    {
      "id": 14,
      "name": "Экшен",
      "image": {
        "preview": "/storage/anime/genres/images/14/HVxcEvm7oA6JQvnMKKgSdYJ90ab8Zoco.jpg",
        "thumbnail": "/storage/anime/genres/images/14/7JeDltmth6vVUs1bG4OHq6ywRYVjbYoY.jpg",
        "optimized": {
          "preview": "/storage/anime/genres/images/14/FNZP4gLtDFe67Ynbthc08wRsTp5q94sx.webp",
          "thumbnail": "/storage/anime/genres/images/14/gfzjNkJYPgeaIyQxXveaP5UblbQWadEF.webp"
        }
      },
      "total_releases": 671
    },
    {
      "id": 29,
      "name": "Фэнтези",
      "image": {
        "preview": "/storage/anime/genres/images/29/BqPfwYPC7STQ0lsv6LsdyDm594Tnz2N5.jpg",
        "thumbnail": "/storage/anime/genres/images/29/bkKObn59vWFAd8wcAPINJnI8EZLZB8gH.jpg",
        "optimized": {
          "preview": "/storage/anime/genres/images/29/BayKuKbzHQkKMlfFyUTZAoExCjqkHDfh.webp",
          "thumbnail": "/storage/anime/genres/images/29/yVUCPUfGguBeZ280YyS5UhawlR3F1fS0.webp"
        }
      },
      "total_releases": 620
    },
    {
      "id": 5,
      "name": "Сейнен",
      "image": {
        "preview": "/storage/anime/genres/images/5/ekFrF3Puccsi75ngq0fzd4fUbnXiGCnn.jpg",
        "thumbnail": "/storage/anime/genres/images/5/CfIxntJmgBabUiBQChxB0WZHdSF5L87K.jpg",
        "optimized": {
          "preview": "/storage/anime/genres/images/5/sTleU4eW0CiqDIiiyRniPJIQlB8HZagG.webp",
          "thumbnail": "/storage/anime/genres/images/5/RsbTRZ6lb0zhLCP033o9PEmsFRwVqLp5.webp"
        }
      },
      "total_releases": 190
    }
  ],
  "members": [
    {
      "id": "98e8b35d-c678-4001-aa01-7bfbaa27eace",
      "role": {
        "value": "voicing",
        "description": "Озвучка"
      },
      "nickname": "WhiteCroW",
      "user": null
    },
    {
      "id": "98e8b364-63cc-46a8-9ff2-1b24b3540490",
      "role": {
        "value": "voicing",
        "description": "Озвучка"
      },
      "nickname": "MefistoO",
      "user": null
    },
    {
      "id": "98e8b37c-dbba-4611-8bb7-16e8800b243c",
      "role": {
        "value": "voicing",
        "description": "Озвучка"
      },
      "nickname": "Frederica Izzard",
      "user": null
    },
    {
      "id": "98e8b386-d206-4965-b709-640e8f18683c",
      "role": {
        "value": "timing",
        "description": "Работа со звуком"
      },
      "nickname": "emmett",
      "user": null
    },
    {
      "id": "98e8b480-83b0-4ce1-9792-89b4ff4613a2",
      "role": {
        "value": "editing",
        "description": "Редактура"
      },
      "nickname": "dream_minseok",
      "user": null
    }
  ],
  "sponsors": [],
  "episodes": [
    {
      "id": "98e8ac36-4084-4f4c-99f0-cc67bb713ae2",
      "name": "Перерождение",
      "ordinal": 1,
      "opening": {
        "stop": null,
        "start": null
      },
      "ending": {
        "stop": null,
        "start": null
      },
      "preview": {
        "src": "/storage/releases/episodes/previews/9427/1/KHJvr8G5l6E4z9gX.jpg",
        "preview": "/storage/releases/episodes/previews/9427/1/KHJvr8G5l6E4z9gX.jpg",
        "thumbnail": "/storage/releases/episodes/previews/9427/1/KHJvr8G5l6E4z9gX__6126bd8750123a4bfc9cd479e57cce60.jpg",
        "optimized": {
          "src": "/storage/releases/episodes/previews/9427/1/KHJvr8G5l6E4z9gX__ee766981a2633386b6133147b96b9916.webp",
          "preview": "/storage/releases/episodes/previews/9427/1/KHJvr8G5l6E4z9gX__ee766981a2633386b6133147b96b9916.webp",
          "thumbnail": "/storage/releases/episodes/previews/9427/1/KHJvr8G5l6E4z9gX__9f5d67b194d03ab270da689b9f6ea682.webp"
        }
      },
      "hls_480": "https://cache-rfn.libria.fun/videos/media/ts/9427/1/480/84149fb14715f13697b207338e5bdf61.m3u8?countryIso=RU&isAuthorized=1&isWithVideoAds=0&isWithVideoAdsAlways=0",
      "hls_720": "https://cache-rfn.libria.fun/videos/media/ts/9427/1/720/6aa0289a3011ce1853d931b88422cfe0.m3u8?countryIso=RU&isAuthorized=1&isWithVideoAds=0&isWithVideoAdsAlways=0",
      "hls_1080": "https://cache-rfn.libria.fun/videos/media/ts/9427/1/1080/72a423a0437a58c6bb1cf7fa99ce115a.m3u8?countryIso=RU&isAuthorized=1&isWithVideoAds=0&isWithVideoAdsAlways=0",
      "duration": 1420,
      "rutube_id": null,
      "youtube_id": null,
      "updated_at": "2023-04-11T22:53:36+00:00",
      "sort_order": 1,
      "release_id": 9427,
      "name_english": null
    },
  ],
  "torrents": [
    {
      "id": 24302,
      "hash": "4e6ccd8f94e732107261cd3240f9761585c48db9",
      "size": 5224249601,
      "type": {
        "value": "WEBRip",
        "description": "WEBRip"
      },
      "label": "Dead Mount Death Play - AniLiberty.TOP [WEBRip 1080p][HEVC][1-12]",
      "codec": {
        "value": "x265/HEVC",
        "label": "HEVC",
        "description": "x265/HEVC",
        "label_color": "#FFEB3B",
        "label_is_visible": true
      },
      "color": {
        "value": null,
        "description": null
      },
      "magnet": "magnet:?xt=urn:btih:4e6ccd8f94e732107261cd3240f9761585c48db9&dn=Dead+Mount+Death+Play+-+AniLibria.TV+%5BWEBRip+1080p+HEVC%5D&xl=5224249601&tr=http://tr.libria.fun:2710/announce?pk=GIMG...BHHXS&tr=http://retracker.local/announce",
      "seeders": 27,
      "quality": {
        "value": "1080p",
        "description": "1080p"
      },
      "bitrate": null,
      "filename": "Dead Mount Death Play - AniLiberty.TOP [WEBRip 1080p][HEVC][1-12].torrent",
      "leechers": 2,
      "sort_order": 0,
      "created_at": "2023-04-12T04:22:16+00:00",
      "updated_at": "2023-06-28T02:47:06+00:00",
      "is_hardsub": false,
      "description": "1-12",
      "completed_times": 17016,
      "release": {
        "id": 9427,
        "type": {
          "value": "TV",
          "description": "ТВ"
        },
        "year": 2023,
        "name": {
          "main": "Смертельная игра мёртвой горы",
          "english": "Dead Mount Death Play",
          "alternative": null
        },
        "alias": "dead-mount-death-play",
        "season": {
          "value": "spring",
          "description": "Весна"
        },
        "poster": {
          "src": "/storage/releases/posters/9427/AJ1xmkZ4TMs5eyTluXcedNiUun3tEcHm.jpg",
          "preview": "/storage/releases/posters/9427/AJ1xmkZ4TMs5eyTluXcedNiUun3tEcHm.jpg",
          "thumbnail": "/storage/releases/posters/9427/E9ZlXcygjy6nn4SLui0cVV7xywF4RQWz.jpg",
          "optimized": {
            "src": "/storage/releases/posters/9427/OvJF4jZlrAbNqTS8FZrZo8KrJQw8HPjf.webp",
            "preview": "/storage/releases/posters/9427/OvJF4jZlrAbNqTS8FZrZo8KrJQw8HPjf.webp",
            "thumbnail": "/storage/releases/posters/9427/uqJu5Cib6BMkhkPqc0Rc1mAhVvIzpVSj.webp"
          }
        },
        "fresh_at": "2023-06-27T23:51:12+00:00",
        "created_at": "2023-03-08T00:59:48+00:00",
        "updated_at": "2024-08-02T19:56:36+00:00",
        "is_ongoing": false,
        "age_rating": {
          "value": "R16_PLUS",
          "label": "16+",
          "is_adult": false,
          "description": "Для людей, достигших возраста шестнадцати лет (16+)"
        },
        "publish_day": {
          "value": 3,
          "description": "Среда"
        },
        "description": "...",
        "notification": null,
        "episodes_total": 12,
        "external_player": null,
        "is_in_production": false,
        "is_blocked_by_geo": false,
        "is_blocked_by_copyrights": false,
        "added_in_users_favorites": 13057,
        "average_duration_of_episode": null,
        "added_in_planned_collection": 312,
        "added_in_watched_collection": 1567,
        "added_in_watching_collection": 116,
        "added_in_postponed_collection": 53,
        "added_in_abandoned_collection": 85
      }
    }
  ]
}
```


## Change status

```bash
curl -X POST 'https://www.anilibria.top/api/v1/accounts/users/me/collections' \
  --data-raw '[{"release_id":9541,"type_of_collection":"PLANNED"}]'
```

Возвращает все статусы 

200 OK
```json
[
    [
        513,
        "WATCHED"
    ],
    [
        774,
        "WATCHED"
    ],
]
```
