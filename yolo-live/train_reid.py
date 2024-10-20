import os
import os.path as osp
from torchreid.data import VideoDataset
import torchreid
import cv2
import shutil

# to use this class, put videos into ./reid-data/video_dataset directory, separated into folders of different objects
# ensure that ./reid-data/video_dataset/frames is deleted if videos in dataset are changed/added
# for example:
    # reid-data/
    # └── video_dataset/
    #     ├── object1/
    #     │   ├── video1.mp4
    #     │   ├── video2.mp4
    #     │   └── video3.mp4
    #     ├── object2/
    #     │   ├── video1.mp4
    #     │   ├── video2.mp4
    #     │   └── video3.mp4
    #     └── object3/
    #         ├── video1.mp4
    #         ├── video2.mp4
    #         └── video3.mp4
class NewDataset(VideoDataset):
    def __init__(self, **kwargs):
        dataset_dir = osp.join(osp.abspath(osp.expanduser('')), 'reid-data', 'video_dataset')

        train_dir = osp.join(dataset_dir, "frames", "train")
        query_dir = osp.join(dataset_dir, "frames", "query")
        gallery_dir = osp.join(dataset_dir, "frames", "gallery")
        train_tuples = []
        query_tuples = []
        gallery_tuples = []
        
        print("Reading frames from videos...")
        obj_idx = -1
        for item in os.listdir(dataset_dir):
            # skip items in dataset_dir that are non-directories
            obj_dir_path = osp.join(dataset_dir, item)
            if not osp.isdir(obj_dir_path):
                continue
            obj_idx += 1

            for item in os.listdir(obj_dir_path):
                vid_path = osp.join(obj_dir_path, item)
                if osp.isdir(vid_path):
                    continue
                
                # create directory inside train, query, gallery directories for the current video
                # if directory already exists, assume video has been read before, thus skip
                vid_output_train_dir = osp.join(train_dir, item)
                vid_output_query_dir = osp.join(query_dir, item)
                vid_output_gallery_dir = osp.join(gallery_dir, item)
                train_paths = []
                query_paths = []
                gallery_paths = []
                if osp.exists(vid_output_train_dir) and osp.exists(vid_output_query_dir) and osp.exists(vid_output_gallery_dir):
                    for item in os.listdir(vid_output_train_dir):
                        frame_path = osp.join(vid_output_train_dir, item)
                        if not osp.isfile(frame_path):
                            continue
                        train_paths.append(frame_path)
                    for item in os.listdir(vid_output_query_dir):
                        frame_path = osp.join(vid_output_query_dir, item)
                        if not osp.isfile(frame_path):
                            continue
                        query_paths.append(frame_path)
                    for item in os.listdir(vid_output_gallery_dir):
                        frame_path = osp.join(vid_output_gallery_dir, item)
                        if not osp.isfile(frame_path):
                            continue
                        gallery_paths.append(frame_path)
                    train_tuples.append((train_paths, 0, 0))
                    query_tuples.append((query_paths, 0, 0))
                    gallery_tuples.append((gallery_paths, 0, 1))
                    continue
                shutil.rmtree(vid_output_train_dir, ignore_errors=True)
                shutil.rmtree(vid_output_query_dir, ignore_errors=True)
                shutil.rmtree(vid_output_gallery_dir, ignore_errors=True)
                os.makedirs(vid_output_train_dir, exist_ok=True)
                os.makedirs(vid_output_query_dir, exist_ok=True)
                os.makedirs(vid_output_gallery_dir, exist_ok=True)

                # read and write each frame to the directory (every frame to train; even frames to query, odd frames to gallery)
                vidcap = cv2.VideoCapture(vid_path)
                frame_count = 0
                while True:
                    is_read_success, frame = vidcap.read()
                    if not is_read_success:
                        break
                    frame_count += 1
                    frame_train_path = osp.join(vid_output_train_dir, f"{frame_count}.jpg")
                    cv2.imwrite(frame_train_path, frame)
                    train_paths.append(frame_train_path)
                    if frame_count % 2 == 0:
                        frame_query_path = osp.join(vid_output_query_dir, f"{frame_count}.jpg")
                        cv2.imwrite(frame_query_path, frame)
                        query_paths.append(frame_query_path)
                    else:
                        frame_gallery_path = osp.join(vid_output_gallery_dir, f"{frame_count}.jpg")
                        cv2.imwrite(frame_gallery_path, frame)
                        gallery_paths.append(frame_gallery_path)
                if frame_count == 0:
                    print(f"Warning: {vid_path} cannot be read from")
                train_tuples.append((train_paths, 0, 0))
                query_tuples.append((query_paths, 0, 0))
                gallery_tuples.append((gallery_paths, 0, 1))
                vidcap.release()

        print("Finished reading frames from videos")
        # print("Train tuples:", train_tuples)
        # print("Query tuples:", query_tuples)
        # print("Gallery tuples:", gallery_tuples)  
        super(NewDataset, self).__init__(train_tuples, query_tuples, gallery_tuples, **kwargs)
    

# Usage
# new_dataset = NewDataset(root='reid-data')
# # train_list = new_dataset.generate_data_list(new_dataset.train)
# # query_list = new_dataset.generate_data_list(new_dataset.query)
# # gallery_list = new_dataset.generate_data_list(new_dataset.gallery)
# train_list = new_dataset.train
# query_list = new_dataset.query
# gallery_list = new_dataset.gallery

# # Print the first few entries of each list for verification
# print("Train List:")
# for entry in train_list[:5]:
#     print(entry)

# print("Query List:")
# for entry in query_list[:5]:
#     print(entry)

# print("Gallery List:")
# for entry in gallery_list[:5]:
#     print(entry)


# torchreid.data.register_image_dataset('data_set', NewDataset)
 
if __name__ == '__main__':
    import torchreid
    from multiprocessing import freeze_support
    import torch

    # new_dataset = NewDataset(root='reid-data')
    # train_list = new_dataset.train
    # query_list = new_dataset.query
    # gallery_list = new_dataset.gallery
    torchreid.data.register_video_dataset('custom_video_dataset', NewDataset)

    freeze_support()
    
    datamanager = torchreid.data.VideoDataManager(
        root='reid-data',
        sources='custom_video_dataset'
    ) 

    test_image_datamanager = torchreid.data.ImageDataManager(
        root='reid-data',
        sources='market1501'
    )

    model = torchreid.models.build_model(
            name="osnet_x1_0",
            num_classes=datamanager.num_train_pids,
            loss="softmax",
            pretrained=True
    )

    optimizer = torchreid.optim.build_optimizer(
            model,
            optim="sgd",
            lr=0.01,
            staged_lr=True,
            new_layers='classifier',
            base_lr_mult=0.1
    )

    scheduler = torchreid.optim.build_lr_scheduler(
            optimizer,
            lr_scheduler="single_step",
            stepsize=20
    )
    
    # start_epoch = torchreid.utils.resume_from_checkpoint(
    #     'log/resnet50/model/model.pth.tar-10',
    #     model,
    #     optimizer
    # )

    engine = torchreid.engine.VideoSoftmaxEngine(
            datamanager,
            model,
            optimizer=optimizer,
            scheduler=scheduler,
            label_smooth=True
            # start_epoch=start_epoch
    )

    test_engine = torchreid.engine.ImageSoftmaxEngine(
            test_image_datamanager,
            model,
            optimizer=optimizer,
            scheduler=scheduler,
            label_smooth=True
            # start_epoch=start_epoch
    )

    # engine.run(
    #         save_dir="log/custom_video_dataset",
    #         max_epoch=5,
    #         eval_freq=5,
    #         print_freq=1,
    #         test_only=False,
    #         fixbase_epoch=5,
    #         open_layers='classifier',
    #         visrank=False,
    #         visrank_topk=20,
    #         ranks=[1, 5]
    # )

    test_engine.run(
            test_only=True,
            visrank=False,
            visrank_topk=20,
            ranks=[1, 5]
    )