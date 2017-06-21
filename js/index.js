//数据接口地址
var dataUrl = './data/data.json';

//音频管理对象
var audioManager;

//作用域
var $scope = $(document.body);

//定义我们的audio管理对象
var AudioManager = function(dataList) {
	console.log(this);
	//数据列表
	this.dataList = dataList;
	//数据索引
	this.index = 0;
	//数据长度
	this.len = dataList.length;
	//audio对象
	this.audio = new Audio();
	//设置preload属性
	this.audio.preload = 'auto';
	this.duration = dataList[0].duration;
	this.setAudio();
	this.bindAudioEvent();
	this.autoPlay = false;
};

AudioManager.prototype = {
	//播放下一首
	playNext: function () {
		this.index ++;
		if(this.index === this.len) {
			this.index = 0;
		}
		this.setAudio();
	},
	//播放上一首
	playPrev: function () {
		this.index --;
		if(this.index === -1) {
			this.index = this.len - 1;
		}
		this.setAudio();
	},
	//播放指定
	playIndex: function (index) {
		this.index = index;
		this.autoPlay = true;
		this.setAudio();
	},
	setAudio: function () {
		//首先获取到当前歌曲信息
		var data = this.dataList[this.index];
		this.duration = data.duration;
		this.audio.src = data.audio;

		//触发changeAudio事件
		$scope.trigger('changeAudio');
	},
	//给audio对象绑定事件
	bindAudioEvent: function () {
		var _self = this;
		//ended 当一首歌结束，直接放下一首
		$(this.audio).on('ended', function () {
			_self.playNext();//this不是audioManager对象
		});

		//loadedmetadata 事件在手机上只有点击了播放按钮才触发
		$(this.audio).on('loadedmetadata', function () {
			if(_self.autoPlay) {
				this.play();
			}
		});
	},
	//播放函数
	play: function () {
		this.autoPlay = true;
		this.audio.play();
	},
	pause: function () {
		this.autoPlay = false;
		this.audio.pause();
	},
	//获取当前歌曲信息
	getCurInfo: function() {
		return this.dataList[this.index];
	},
	//获取当前播放百分比
	getPlayRatio: function () {
		return this.audio.currentTime / this.duration;
	},
	//获取当前播放时间    radio(百分比)
	getCurTime: function (ratio) {
		//如果直接返回，小数点后很多位，取整处理
		// return this.audio.currentTime;
		var curTime = this.audio.currentTime;
		if(ratio) {
			curTime = ratio * this.duration;
		}
		return Math.round(curTime);
	},
	//从当前时间开始播放
	jumpToPlay: function (ratio) {
		var time = ratio * this.duration;

		this.autoPlay = true;
		//让当前audio从time开始播放
		this.audio.currentTime = time;
		//为了避免在暂停的情况下拖拽小点
		this.audio.play();

	}
};


//audioManager end


//controManager start
var controlManager = (function () {
	var $playBtn = $('.play-btn'),
		$nextBtn = $('.next-btn'),
		$prevBtn = $('.pre-btn'),
		$likeBtn = $('.like-btn'),
		$listBtn = $('.list-btn'),
		$closeBtn = $('.close-btn'),
		$playList = $('.play-list'),
		$songImg = $('.song-img img'),
		$songInfo = $('.song-info'),
		infoTmpl = __inline('../tmpl/info.tmpl'),
		$timeCur = $('.cur-time'),
		$timeDuration = $('.all-time'),
		likeList = [false, ,false, false, false, false],
		frameId;


	//点赞
	//一般点赞后会发送到服务器





	//绑定点击事件
	function addClickEvent() {
		$playBtn.on('click', function () {
			console.log('play');
			if($(this).hasClass('playing')) {
				//暂停
				audioManager.pause();
			}else{
				//播放
				audioManager.play();
				setProcess();
			}
			//toggleClass切换如果有playing就删掉class，没有就加上
			$(this).toggleClass('playing');
		});
		$nextBtn.on('click',function () {
			console.log('next');
			audioManager.playNext();
		});
		$prevBtn.on('click', function () {
			console.log('prev');
			audioManager.playPrev();
		});
		$likeBtn.on('click', function () {
			var index = audioManager.index;

			if(likeList[index]) {
				return;
			}else {
				//为了修改点赞按钮样式
				$(this).addClass('disabled');
				//标记当前歌曲点赞
				likeList[index] = true;
			}
		});
		$listBtn.on('click', function () {
			$playList.find('li').removeClass('playing').eq(audioManager.index).addClass('playing');
			$playList.css({
				transform: 'translateY(0)'
			});
		});
		$playList.on('click', 'li', function () {
			var self = $(this),
				index = self.data('index');
			self.siblings('.playing').removeClass('playing');
			self.addClass('playing');
			audioManager.playIndex(index);
			$('.play-btn').addClass('playing');

			setTimeout(function () {
				$closeBtn.trigger('click');
			}, 500);
		});

		$closeBtn.on('click', function () {
			$playList.css({
				transform: 'translateY(100%)'
			});
		});
	};

	//格式化时间
	function formatTime(during) {
		var minute  = Math.floor(during / 60),
			second = Math.floor(during - minute * 60);

		//取到是一位
		if(minute < 10) {
			minute = '0' + minute;
		}
		if(second < 10) {
			second = '0' + second;
		}
		return minute + ':' + second;
	}


	//渲染页面
	function renderInfo () {
		var curData = audioManager.getCurInfo(),
			setImage = function (src) {
				var img = new Image();

				$(img).on('load', function () {
					$songImg.attr('src', src);
					blurImg(this, $('.content-wrap'));
				});

				img.src = src;
			};

		//设置歌曲信息
		$songInfo.html(infoTmpl(curData));

		//设置图片和模糊背景
		setImage(curData.image);

		//设置当前歌曲时间
		$timeDuration.text(formatTime(audioManager.duration));

		//渲染like按钮  切换歌曲会改变点赞样式
		if(likeList[audioManager.index]) {
			$likeBtn.addClass('disabled');
		}else {
			$likeBtn.removeClass('disabled');
		}
	};


	//设置播放进度条
	function setProcess () {
		//再进来的时候要先清除上一次的animationFrame
		cancelAnimationFrame(frameId);
		var $proTop = $('.pro-top'),
			frame = function () {
				//首先需要获得到当前播放的百分比
				var playRatio = audioManager.getPlayRatio(),
					translatePercent = (playRatio - 1) * 100,
					time = formatTime(audioManager.getCurTime());


				//渲染当前播放时间
				$timeCur.text(time);

				//渲染进度条
				if(translatePercent < 0) {
					$proTop.css({
						transform: 'translateX(' + translatePercent + '%)',
						'-webkit-transform': 'translateX(' + translatePercent + '%)'
					});
					frameId = requestAnimationFrame(frame);
				}else {
					$proTop.css({
						transform: 'translateX(0)',
						'-webkit-transform': 'translateX(0)'
					});
					cancelAnimationFrame(frameId);
				}

			};
		frame();
	}


	//设置拖拽事件
	function addPocessEvent () {
		var $slidePoint = $('.slide-point'),
			$proTop = $('.pro-top'),
			offsetX = $('.pro-wrap').offset().left,
			width = $('.pro-wrap').width();

		$slidePoint.on('touchstart', function () {
			//需要取消掉animationFrame
			cancelAnimationFrame(frameId);
		}).on('touchmove', function (e) {
			var x = e.changedTouches[0].clientX - offsetX,
				ratio = x / width,
				translatePercent = (ratio - 1) * 100,
				time = formatTime(audioManager.getCurTime(ratio));

			if(ratio < 0 || ratio > 1) {
				return;
			}


			//渲染当前时间
			$timeCur.text(time);

			//设置进度条位置偏移
			$proTop.css({
				transform: 'translateX(' + translatePercent + '%)',
				'-webkit-transform': 'translateX(' + translatePercent + '%)'
			});
			return false;//阻止默认行为
		}).on('touchend', function(e) {
			var ratio = (e.changedTouches[0].clientX - offsetX) / width;

			audioManager.jumpToPlay(ratio);
			$playBtn.addClass('playing');
			setProcess();
		})
	}

	//controlManager初始函数
	var init = function () {
		renderInfo();
		addClickEvent();
		addPocessEvent();

		//绑定changeAudio事件
		//解耦
		//在audioManager -> controlManager -> 事件机制
		$scope.on('changeAudio', function () {
			//重新渲染并设置进度条
			renderInfo();
			setProcess();
		});
	};


	return {
		init: init
	}
})();


//controlManager end

//通过ajax取数据

var success = function(d) {
	//alert('success');
	//初始化audioManager
	console.log(d);
	audioManager = new AudioManager(d);
	//初始化controlManager
	controlManager.init();
	renderList(d);
};

function getData(url, cb) {
	$.ajax({
		url: url,
		type: 'GET',
		success: cb,
		error: function () {
			alert('deal wrong');
		}
	})
}

getData(dataUrl, success);


//渲染播放列表
function renderList (data) {
	var tmpl = __inline('../tmpl/list.tmpl'),
		$html = $(tmpl(data));

	$('.play-list ul').html($html);
}


